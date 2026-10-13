import { v } from 'convex/values';
import { internalMutation } from './_generated/server';

// A caller that gets this many 404s from one tool inside one window is a
// loop on deleted resources, not an agent: block that tool for BLOCK_MS.
export const NOT_FOUND_WINDOW_MS = 10 * 60_000;
export const NOT_FOUND_THRESHOLD = 50;
export const NOT_FOUND_BLOCK_MS = 10 * 60_000;

export interface NotFoundState {
  windowStart: number;
  count: number;
  blockedUntil: number;
}

// Pure so it can be tested without a database.
export function nextNotFoundState(
  previous: NotFoundState | null,
  now: number
): NotFoundState {
  const fresh = !previous || now - previous.windowStart >= NOT_FOUND_WINDOW_MS;
  const windowStart = fresh ? now : previous.windowStart;
  const count = fresh ? 1 : previous.count + 1;
  const blockedUntil =
    count >= NOT_FOUND_THRESHOLD
      ? now + NOT_FOUND_BLOCK_MS
      : (previous?.blockedUntil ?? 0);
  return { windowStart, count, blockedUntil };
}

export const recordNotFound = internalMutation({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    const row = await ctx.db
      .query('notFoundCounters')
      .withIndex('by_key', (q) => q.eq('key', key))
      .unique();
    const next = nextNotFoundState(row, Date.now());
    if (row) await ctx.db.patch(row._id, next);
    else await ctx.db.insert('notFoundCounters', { key, ...next });
    return next.blockedUntil;
  },
});
