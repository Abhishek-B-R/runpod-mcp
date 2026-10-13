// Hosted loop breaker: Convex counting rule, the instance-side block cache,
// and fail-open behavior.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextNotFoundState,
  NOT_FOUND_BLOCK_MS,
  NOT_FOUND_THRESHOLD,
  NOT_FOUND_WINDOW_MS,
} from '../convex/rateLimit.js';
import {
  createNotFoundLimiter,
  notFoundSinkUrl,
  resetNotFoundBlocks,
} from '#src/specgen/not-found-limiter';

const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => resetNotFoundBlocks());

test('the counter blocks on the threshold-th 404 inside one window', () => {
  let state = nextNotFoundState(null, 0);
  for (let i = 2; i < NOT_FOUND_THRESHOLD; i++) {
    state = nextNotFoundState(state, i);
  }
  assert.equal(state.count, NOT_FOUND_THRESHOLD - 1);
  assert.equal(state.blockedUntil, 0);
  state = nextNotFoundState(state, 100);
  assert.equal(state.blockedUntil, 100 + NOT_FOUND_BLOCK_MS);
});

test('a new window starts the count over', () => {
  const state = nextNotFoundState(
    { windowStart: 0, count: NOT_FOUND_THRESHOLD - 1, blockedUntil: 0 },
    NOT_FOUND_WINDOW_MS
  );
  assert.equal(state.count, 1);
  assert.equal(state.windowStart, NOT_FOUND_WINDOW_MS);
  assert.equal(state.blockedUntil, 0);
});

test('the sink URL is derived from the ALP submit URL', () => {
  assert.equal(
    notFoundSinkUrl('https://x-y-1.convex.site/alp/submit'),
    'https://x-y-1.convex.site/ratelimit/not-found'
  );
  assert.equal(notFoundSinkUrl('https://evil.example/alp/submit'), null);
});

function limiter(
  reply: () => Promise<Response>,
  now = () => 1_000,
  onBlockStarted?: (tool: string, blockedUntil: number) => void
) {
  const calls: Array<{ url: string; body: string; secret: string | null }> = [];
  const fetchImpl = (async (url: string | URL, init?: RequestInit) => {
    calls.push({
      url: String(url),
      body: String(init?.body),
      secret: new Headers(init?.headers).get('x-alp-secret'),
    });
    return reply();
  }) as typeof fetch;
  return {
    calls,
    ...createNotFoundLimiter({
      key: 'a:abc',
      sinkUrl: 'https://x.convex.site/ratelimit/not-found',
      secret: 's3cret',
      fetchImpl,
      now,
      onBlockStarted,
    }),
  };
}

test('only 404s are reported, with the secret and the hashed pair key', async () => {
  const l = limiter(async () => Response.json({ blockedUntil: 0 }));
  l.onToolResult('get-pod', 200);
  l.onToolResult('get-pod', 400);
  l.onToolResult('get-pod', 404);
  await flush();
  assert.equal(l.calls.length, 1);
  assert.equal(l.calls[0].secret, 's3cret');
  assert.deepEqual(JSON.parse(l.calls[0].body), { key: 'a:abc|get-pod' });
  assert.deepEqual(await l.rateLimiter('x', 'get-pod'), { allowed: true });
});

test('a block from the sink denies that tool only, until it expires', async () => {
  let clock = 1_000;
  const l = limiter(
    async () => Response.json({ blockedUntil: 61_000 }),
    () => clock
  );
  l.onToolResult('get-pod', 404);
  await flush();
  await flush();
  assert.deepEqual(await l.rateLimiter('x', 'get-pod'), {
    allowed: false,
    retryAfterS: 60,
    reason: 'not_found_loop',
  });
  assert.deepEqual(await l.rateLimiter('x', 'list-pods'), { allowed: true });
  clock = 61_000;
  assert.deepEqual(await l.rateLimiter('x', 'get-pod'), { allowed: true });
});

test('a failing or unreachable sink fails open', async () => {
  const down = limiter(async () => new Response('nope', { status: 500 }));
  down.onToolResult('get-pod', 404);
  const throws = limiter(async () => {
    throw new Error('network down');
  });
  throws.onToolResult('get-pod', 404);
  await flush();
  await flush();
  assert.deepEqual(await down.rateLimiter('x', 'get-pod'), { allowed: true });
  assert.deepEqual(await throws.rateLimiter('x', 'get-pod'), {
    allowed: true,
  });
});

test('onBlockStarted fires only when the sink says this 404 started the block', async () => {
  const started: Array<[string, number]> = [];
  let replyStarted = true;
  const l = limiter(
    async () => Response.json({ blockedUntil: 61_000, started: replyStarted }),
    () => 1_000,
    (tool, until) => started.push([tool, until])
  );
  l.onToolResult('get-pod', 404);
  await flush();
  await flush();
  replyStarted = false;
  l.onToolResult('get-pod', 404);
  await flush();
  await flush();
  assert.deepEqual(started, [['get-pod', 61_000]]);
});
