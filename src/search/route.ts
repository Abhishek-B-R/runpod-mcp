// POST /api/search on the hosted server: the stdio package's path to
// searchKnowledge (src/search/knowledge.ts), authenticated with the caller's
// own Runpod API key. Kept apart from knowledge.ts so the stdio bundle, which
// imports the tool, does not pull in the HTTP shell.

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CredentialChecker } from '../_shared/credential-check.js';
import { defaultCredentialChecker, extractBearerToken } from '../http.js';
import {
  parseSearchRequest,
  searchKnowledge,
  type SearchKnowledgeOptions,
} from './knowledge.js';

export interface SearchRouteOptions extends SearchKnowledgeOptions {
  /** Test seam. Production uses the shared credential checker. */
  verify?: CredentialChecker;
}

export async function handleSearch(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  opts: SearchRouteOptions = {}
): Promise<void> {
  const send = (code: number, body: unknown) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  // Input first: it is free, and the credential probe is not.
  const body = (
    req.body && typeof req.body === 'object' && !Array.isArray(req.body)
      ? req.body
      : {}
  ) as Record<string, unknown>;
  const parsed = parseSearchRequest(body);

  const token = extractBearerToken(req);
  if (!token) {
    send(401, {
      error: 'Authenticate with your Runpod API key as a Bearer token.',
    });
    return;
  }
  if ('error' in parsed) {
    send(400, { error: parsed.error });
    return;
  }
  // Only a key the API rejects is refused. An unreachable auth backend fails
  // open: a docs search exposes nothing account-scoped.
  const verdict = await (opts.verify ?? defaultCredentialChecker.verify)(token);
  if (verdict.status === 'invalid') {
    send(401, { error: 'This Runpod API key is not valid.' });
    return;
  }
  const outcome = await searchKnowledge(parsed.request, opts);
  send(outcome.status, outcome.body);
}
