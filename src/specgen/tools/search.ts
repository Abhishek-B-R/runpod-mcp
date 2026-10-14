// search-docs: semantic search over Runpod's documentation, curated support
// knowledge, blog and runpod.io site, through the runpod-assistant knowledge
// index (src/search/knowledge.ts).
//
// The tool takes its search function from the transport: the hosted server
// searches in-process with its service key; stdio calls the hosted
// POST /api/search with the caller's own key. Registered only when a search
// function is configured, so a deployment without one does not list it.

import {
  MAX_QUERY_CHARS,
  MAX_SEARCH_LIMIT,
  parseSearchRequest,
  SEARCH_NAMESPACES,
  type SearchFn,
  type SearchOutcome,
} from '../../search/knowledge.js';
import type { CuratedTool } from '../types.js';
import { readOnly } from './annotations.js';
import { badRequest } from './util.js';

const SEARCH_CLIENT_TIMEOUT_MS = 55_000;

export function createSearchDocsTool(search: SearchFn): CuratedTool {
  return {
    name: 'search-docs',
    annotations: readOnly,
    recordedArguments: ['limit'],
    description:
      'Search Runpod documentation, curated support knowledge, the Runpod blog and runpod.io for passages that answer a question, for example "how do I attach a network volume to a Serverless endpoint". Returns ranked passages with their source URLs. Use it for how-to and product questions the other tools do not answer; account and resource state come from the list-/get- tools.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          maxLength: MAX_QUERY_CHARS,
          description: 'The question, in natural language.',
        },
        namespaces: {
          type: 'array',
          items: { type: 'string', enum: [...SEARCH_NAMESPACES] },
          minItems: 1,
          description:
            'Sources to search: docs (docs.runpod.io), knowledge (curated support answers), blog, site (runpod.io pages). Default: docs, knowledge, blog.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: MAX_SEARCH_LIMIT,
          description: 'Most passages to return. Default 8.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
    handler: async (_ctx, args) => {
      const parsed = parseSearchRequest(args);
      if ('error' in parsed) return badRequest(parsed.error);
      const outcome = await search(parsed.request);
      return {
        ok: outcome.status === 200,
        status: outcome.status,
        payload: outcome.body,
      };
    },
  };
}

/** stdio: search through the hosted server's POST /api/search. */
export function hostedSearch(
  searchUrl: string,
  apiKey: string | undefined,
  doFetch: typeof fetch = fetch
): SearchFn {
  return async (request): Promise<SearchOutcome> => {
    try {
      const res = await doFetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(SEARCH_CLIENT_TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as
        | SearchOutcome['body']
        | null;
      return body
        ? { status: res.status, body }
        : {
            status: 502,
            body: { error: `Runpod knowledge search returned ${res.status}.` },
          };
    } catch {
      return {
        status: 504,
        body: {
          error: 'Runpod knowledge search did not respond.',
          hint: 'Retry the same call once.',
        },
      };
    }
  };
}
