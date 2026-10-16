// Knowledge search for search-docs, backed by the runpod-assistant Convex
// deployment's POST /v1/search (docs, curated support knowledge, blog,
// runpod.io site; merged and ranked there).
//
// The assistant's service key (RUNPOD_ASSISTANT_API_KEY) stays on the hosted
// server. The hosted search-docs tool calls searchKnowledge in-process; the
// stdio package calls the hosted POST /api/search (route.ts) with the
// caller's own Runpod API key, so the npm package never holds the service key.
//
// RETRIES: /v1/search admits a fixed number of concurrent searches (the
// Convex plan caps concurrent actions) and rejects the rest at once with 503,
// 429, or Convex's own "Too many concurrent requests". A slot frees in about
// one search latency (~0.3s), so this client retries those with jittered
// exponential backoff, the same contract as the assistant's own client
// (runpod-assistant convex/rag/knowledge.ts, searchKnowledgeHttp). Every other
// failure is returned at once. The whole call fits a deadline well under the
// hosted function's 60s maxDuration.

import { knowledgeSearchBase, type Env } from '../_shared/hosts.js';

export const SEARCH_NAMESPACES = ['docs', 'knowledge', 'blog', 'site'] as const;
/** /v1/search caps a query at 2000 characters and a page at 4 x 5 results. */
export const MAX_QUERY_CHARS = 2000;
export const MAX_SEARCH_LIMIT = 20;

export interface SearchRequest {
  query: string;
  namespaces?: string[];
  limit?: number;
}

/** The fields of the /v1/search response this server passes on. */
interface SearchResponse {
  text: string;
  totalResults: number;
  failedNamespaces: string[];
}

/** A search outcome as an HTTP status plus a JSON body, success or not. */
export interface SearchOutcome {
  status: number;
  body: SearchResponse | { error: string; hint?: string };
}

/** Backs search-docs. apiKey is the caller's Runpod key (stdio forwards it). */
export type SearchFn = (
  request: SearchRequest,
  apiKey: string | undefined
) => Promise<SearchOutcome>;

export interface SearchKnowledgeOptions {
  /** Test seams. Production uses process.env, global fetch, and real timers. */
  env?: Env;
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

const ATTEMPTS = 7;
const BASE_DELAY_MS = 250;
const ATTEMPT_TIMEOUT_MS = 10_000;
/** No retry starts after this. Leaves room for one last attempt under 60s. */
const RETRY_DEADLINE_MS = 30_000;

const PLATFORM_LIMIT = /TooManyConcurrentRequests|Too many concurrent requests/;

const AT_CAPACITY: SearchOutcome = {
  status: 503,
  body: {
    error: 'Runpod knowledge search is at capacity.',
    hint: 'Retry the same call in a few seconds.',
  },
};

const UNREACHABLE: SearchOutcome = {
  status: 504,
  body: {
    error: 'Runpod knowledge search did not respond.',
    hint: 'Retry the same call once.',
  },
};

/** Configured when this deployment can reach /v1/search with the service key. */
export function searchConfigured(env: Env = process.env): boolean {
  return Boolean(knowledgeSearchBase(env) && env.RUNPOD_ASSISTANT_API_KEY);
}

/** Validate tool or route input. Returns the request or a client-facing error. */
export function parseSearchRequest(
  raw: Record<string, unknown>
): { request: SearchRequest } | { error: string } {
  if (typeof raw.query !== 'string' || !raw.query.trim()) {
    return { error: 'query must be a non-empty string.' };
  }
  if (raw.query.length > MAX_QUERY_CHARS) {
    return { error: `query exceeds ${MAX_QUERY_CHARS} characters.` };
  }
  const request: SearchRequest = { query: raw.query };
  if (raw.namespaces !== undefined) {
    if (
      !Array.isArray(raw.namespaces) ||
      raw.namespaces.length === 0 ||
      !raw.namespaces.every((ns) =>
        (SEARCH_NAMESPACES as readonly unknown[]).includes(ns)
      )
    ) {
      return {
        error: `namespaces must be a non-empty list of: ${SEARCH_NAMESPACES.join(', ')}.`,
      };
    }
    request.namespaces = raw.namespaces as string[];
  }
  if (raw.limit !== undefined) {
    if (
      typeof raw.limit !== 'number' ||
      !Number.isInteger(raw.limit) ||
      raw.limit < 1 ||
      raw.limit > MAX_SEARCH_LIMIT
    ) {
      return {
        error: `limit must be an integer from 1 to ${MAX_SEARCH_LIMIT}.`,
      };
    }
    request.limit = raw.limit;
  }
  return { request };
}

/** Call /v1/search with the service key, retrying capacity rejections. */
export async function searchKnowledge(
  request: SearchRequest,
  opts: SearchKnowledgeOptions = {}
): Promise<SearchOutcome> {
  const env = opts.env ?? process.env;
  const doFetch = opts.fetch ?? fetch;
  const sleep =
    opts.sleep ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const now = opts.now ?? Date.now;
  if (!searchConfigured(env)) {
    return {
      status: 503,
      body: { error: 'Knowledge search is not configured on this server.' },
    };
  }
  const url = `${knowledgeSearchBase(env)}/v1/search`;
  // Built once: every attempt sends the same request.
  const init = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RUNPOD_ASSISTANT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...request, source: 'runpod-mcp' }),
  };
  const startedAt = now();
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await doFetch(url, {
        ...init,
        signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
      });
      if (res.ok) {
        // A non-JSON 200 (proxy page, truncated body) is an upstream fault,
        // not an unreachable one.
        const data = (await res
          .json()
          .catch(() => null)) as Partial<SearchResponse> | null;
        if (!data) {
          console.warn('knowledge_search_failed status=200 invalid_json');
          return {
            status: 502,
            body: { error: 'Runpod knowledge search failed.' },
          };
        }
        return {
          status: 200,
          body: {
            text: String(data.text ?? ''),
            totalResults: Number(data.totalResults ?? 0),
            failedNamespaces: Array.isArray(data.failedNamespaces)
              ? data.failedNamespaces
              : [],
          },
        };
      }
      const text = await res.text();
      const retryable =
        res.status === 503 || res.status === 429 || PLATFORM_LIMIT.test(text);
      if (!retryable) {
        // 400 is the caller's input; anything else is ours to fix, and the
        // caller cannot act on the upstream detail.
        console.warn(`knowledge_search_failed status=${res.status}`);
        return res.status === 400
          ? { status: 400, body: { error: errorField(text) } }
          : { status: 502, body: { error: 'Runpod knowledge search failed.' } };
      }
    } catch (error) {
      console.warn(
        `knowledge_search_unreachable ${error instanceof Error ? error.name : 'error'}`
      );
      return UNREACHABLE;
    }
    const delay = Math.random() * BASE_DELAY_MS * 2 ** (attempt - 1);
    if (attempt >= ATTEMPTS || now() - startedAt + delay > RETRY_DEADLINE_MS) {
      return AT_CAPACITY;
    }
    await sleep(delay);
  }
}

function errorField(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: unknown };
    if (typeof parsed.error === 'string') return parsed.error;
  } catch {
    // Not JSON: fall through to the generic message.
  }
  return 'Invalid search request.';
}

const HOSTED_CLIENT_TIMEOUT_MS = 55_000;

/** stdio: search through the hosted server's POST /api/search (route.ts). */
export function hostedSearch(
  searchUrl: string,
  doFetch: typeof fetch = fetch
): SearchFn {
  return async (request, apiKey) => {
    try {
      const res = await doFetch(searchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(HOSTED_CLIENT_TIMEOUT_MS),
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
      return UNREACHABLE;
    }
  };
}
