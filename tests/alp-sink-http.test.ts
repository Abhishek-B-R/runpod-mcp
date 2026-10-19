import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from '../convex/http.js';
import { routeValidator } from '../convex/schema.js';
import { oncePerAccountRoute } from '../convex/submissions.js';
import { ALP_ROUTES } from '#src/alp/ingest';
import { ONCE_PER_ACCOUNT_ROUTES } from '#src/alp/sink';

test('ALP sink routes reject invalid JSON shapes before accessing storage', async (t) => {
  const original = process.env.ALP_SINK_SECRET;
  process.env.ALP_SINK_SECRET = 'test-sink-secret';
  t.after(() => {
    if (original === undefined) delete process.env.ALP_SINK_SECRET;
    else process.env.ALP_SINK_SECRET = original;
  });
  for (const [path, method, action] of http.getRoutes()) {
    const handler = (
      action as unknown as {
        _handler: (ctx: object, request: Request) => Promise<Response>;
      }
    )._handler;
    for (const body of ['null', '[]', 'true', '"text"', '{bad']) {
      const response = await handler(
        {},
        new Request(`https://test.invalid${path}`, {
          method,
          body,
          headers: { 'x-alp-secret': 'test-sink-secret' },
        })
      );
      assert.equal(response.status, 400, `${path}: ${body}`);
      assert.deepEqual(await response.json(), {
        error: 'expected a JSON object',
      });
    }
    const unauthorized = await handler(
      {},
      new Request(`https://test.invalid${path}`, {
        method,
        body: '{}',
      })
    );
    assert.equal(unauthorized.status, 401);
  }
});

// The Convex validators are built from the shared route lists
// (src/alp/sink.ts); this pins that wiring.
test('Convex route validators match the server route lists', () => {
  assert.deepEqual(
    routeValidator.members.map((member) => member.value),
    [...ALP_ROUTES]
  );
  assert.deepEqual(
    oncePerAccountRoute.members.map((member) => member.value),
    [...ONCE_PER_ACCOUNT_ROUTES]
  );
  for (const route of ONCE_PER_ACCOUNT_ROUTES)
    assert.ok(ALP_ROUTES.includes(route), route);
});
