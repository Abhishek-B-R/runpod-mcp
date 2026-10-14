// search-docs: config-gated registration, the /v1/search retry contract, and
// the hosted POST /api/search route.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createSpecgenServer } from '#src/specgen/server';
import { createToolContext } from '#src/specgen/context';
import { hostedSearch } from '#src/specgen/tools/search';
import {
  searchKnowledge,
  type SearchFn,
  type SearchOutcome,
} from '#src/search/knowledge';
import { handleSearch } from '#src/search/route';

const ENV = {
  KNOWLEDGE_SEARCH_URL: 'https://test-1.convex.site/',
  RUNPOD_ASSISTANT_API_KEY: 'svc_key',
};
const OK_BODY = {
  results: [
    { id: 'a', title: 'T', namespace: 'docs', tag: 'DOCS', content: 'c' },
  ],
  text: '[1] [DOCS] T\nc',
  totalResults: 1,
  namespacesSearched: ['docs'],
  failedNamespaces: [],
  latencyMs: 12,
};

function respond(status: number, body: unknown): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function connect(search?: SearchFn) {
  const server = createSpecgenServer(
    createToolContext({ apiKey: 'rpa_test' }),
    'test',
    search ? { search } : {}
  );
  const client = new Client({ name: 'test', version: '1' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(st), client.connect(ct)]);
  return client;
}

test('search-docs is absent without a search function', async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.ok(!tools.some((t) => t.name === 'search-docs'));
  await client.close();
});

test('search-docs is listed and passes the validated request through', async () => {
  const seen: unknown[] = [];
  const client = await connect(async (request) => {
    seen.push(request);
    return {
      status: 200,
      body: { text: 'hit', totalResults: 1, failedNamespaces: [] },
    };
  });
  const { tools } = await client.listTools();
  const tool = tools.find((t) => t.name === 'search-docs');
  assert.ok(tool);
  assert.equal(tool.annotations?.readOnlyHint, true);

  const result = await client.callTool({
    name: 'search-docs',
    arguments: { query: 'network volume', namespaces: ['docs'], limit: 3 },
  });
  assert.equal(result.isError, false);
  assert.deepEqual(seen, [
    { query: 'network volume', namespaces: ['docs'], limit: 3 },
  ]);

  const bad = await client.callTool({
    name: 'search-docs',
    arguments: { query: 'x', namespaces: ['wiki'] },
  });
  assert.equal(bad.isError, true);
  assert.equal(seen.length, 1, 'an invalid namespace never reaches the search');
  await client.close();
});

test('searchKnowledge sends the service key and returns the public fields', async () => {
  let call: { url: string; init: RequestInit } | undefined;
  const outcome = await searchKnowledge(
    { query: 'q' },
    {
      env: ENV,
      fetch: async (url, init) => {
        call = { url: String(url), init: init! };
        return respond(200, OK_BODY);
      },
    }
  );
  assert.equal(call?.url, 'https://test-1.convex.site/v1/search');
  assert.equal(
    (call?.init.headers as Record<string, string>).Authorization,
    'Bearer svc_key'
  );
  assert.deepEqual(JSON.parse(String(call?.init.body)), {
    query: 'q',
    source: 'runpod-mcp',
  });
  assert.deepEqual(outcome, {
    status: 200,
    body: { text: OK_BODY.text, totalResults: 1, failedNamespaces: [] },
  });
});

test('searchKnowledge retries 503, 429 and the Convex concurrency error', async () => {
  const replies = [
    respond(503, { error: 'Search is at capacity, retry' }),
    respond(429, { error: 'slow down' }),
    respond(500, 'TooManyConcurrentRequests: Too many concurrent requests'),
    respond(200, OK_BODY),
  ];
  const sleeps: number[] = [];
  const outcome = await searchKnowledge(
    { query: 'q' },
    {
      env: ENV,
      fetch: async () => replies.shift()!,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    }
  );
  assert.equal(outcome.status, 200);
  assert.equal(sleeps.length, 3);
  sleeps.forEach((ms, i) =>
    assert.ok(ms < 250 * 2 ** i, `jittered under the cap: ${ms}`)
  );
});

test('searchKnowledge gives up at the attempt cap with a retryable 503', async () => {
  let calls = 0;
  const outcome = await searchKnowledge(
    { query: 'q' },
    {
      env: ENV,
      fetch: async () => {
        calls++;
        return respond(503, { error: 'at capacity' });
      },
      sleep: async () => {},
    }
  );
  assert.equal(calls, 7);
  assert.equal(outcome.status, 503);
  assert.match(JSON.stringify(outcome.body), /Retry/);
});

test('searchKnowledge stops retrying at the deadline', async () => {
  let clock = 0;
  let calls = 0;
  const outcome = await searchKnowledge(
    { query: 'q' },
    {
      env: ENV,
      now: () => clock,
      fetch: async () => {
        calls++;
        clock += 20_000; // each attempt is slow to be rejected
        return respond(503, { error: 'at capacity' });
      },
      sleep: async () => {},
    }
  );
  assert.equal(calls, 2);
  assert.equal(outcome.status, 503);
});

test('searchKnowledge does not retry other failures and hides upstream detail', async () => {
  let calls = 0;
  const fail = (status: number, body: unknown) =>
    searchKnowledge(
      { query: 'q' },
      {
        env: ENV,
        fetch: async () => {
          calls++;
          return respond(status, body);
        },
        sleep: async () => {},
      }
    );
  assert.deepEqual(
    await fail(400, { error: "'query' exceeds 2000 characters" }),
    {
      status: 400,
      body: { error: "'query' exceeds 2000 characters" },
    }
  );
  const upstream = await fail(401, { error: 'Invalid API key' });
  assert.equal(upstream.status, 502);
  assert.doesNotMatch(JSON.stringify(upstream.body), /Invalid API key/);
  assert.equal(calls, 2);
});

test('searchKnowledge reports a timeout as a 504 and missing config as a 503', async () => {
  const timedOut = await searchKnowledge(
    { query: 'q' },
    {
      env: ENV,
      fetch: async () => {
        throw new DOMException('timed out', 'TimeoutError');
      },
    }
  );
  assert.equal(timedOut.status, 504);
  const unconfigured = await searchKnowledge({ query: 'q' }, { env: {} });
  assert.equal(unconfigured.status, 503);
});

function fakeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    writeHead(code: number) {
      res.statusCode = code;
      return res;
    },
    end(text: string) {
      res.body = JSON.parse(text);
    },
  };
  return res;
}

async function route(
  headers: Record<string, string>,
  body: unknown,
  verdict: 'valid' | 'invalid' | 'unknown' = 'valid',
  upstream: () => Response = () => respond(200, OK_BODY)
) {
  const res = fakeRes();
  let upstreamCalls = 0;
  await handleSearch({ headers, body } as never, res as never, {
    env: ENV,
    verify: async () => ({ status: verdict }),
    fetch: async () => {
      upstreamCalls++;
      return upstream();
    },
    sleep: async () => {},
  });
  return { ...res, upstreamCalls };
}

test('/api/search requires a valid Runpod key', async () => {
  const none = await route({}, { query: 'q' });
  assert.equal(none.statusCode, 401);
  const invalid = await route(
    { authorization: 'Bearer rpa_x' },
    { query: 'q' },
    'invalid'
  );
  assert.equal(invalid.statusCode, 401);
  assert.equal(none.upstreamCalls + invalid.upstreamCalls, 0);
});

test('/api/search fails open when the key cannot be checked, and validates input', async () => {
  const open = await route(
    { authorization: 'Bearer rpa_x' },
    { query: 'q' },
    'unknown'
  );
  assert.equal(open.statusCode, 200);
  assert.equal((open.body as { text: string }).text, OK_BODY.text);
  const bad = await route({ authorization: 'Bearer rpa_x' }, { query: '' });
  assert.equal(bad.statusCode, 400);
  assert.equal(bad.upstreamCalls, 0);
});

test('hostedSearch forwards the caller key and passes the status through', async () => {
  let auth: string | undefined;
  const search = hostedSearch(
    'https://mcp.example/api/search',
    'rpa_user',
    async (_url, init) => {
      auth = (init?.headers as Record<string, string>).Authorization;
      return respond(503, { error: 'at capacity', hint: 'Retry' });
    }
  );
  const outcome: SearchOutcome = await search({ query: 'q' });
  assert.equal(auth, 'Bearer rpa_user');
  assert.equal(outcome.status, 503);

  const html = hostedSearch(
    'https://mcp.example/api/search',
    'rpa_user',
    async () => new Response('<html>404</html>', { status: 404 })
  );
  assert.equal((await html({ query: 'q' })).status, 502);
});
