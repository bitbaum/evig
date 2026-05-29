/**
 * Keyset pagination — the canonical replacement for OFFSET pagination
 * on list endpoints that show "Next page" style navigation.
 *
 * Why keyset over OFFSET:
 *   - OFFSET N has to scan + discard N rows on every request.
 *     At page 50 of a 20-per-page list, that's 1000 rows discarded
 *     before the 20 you actually wanted. Doesn't matter at 100 rows
 *     in a table; matters a lot at 100k.
 *   - Keyset uses `WHERE (sort_col, id) < (cursor_sort_col, cursor_id)`
 *     against the sort index. Constant-time regardless of which
 *     "page" the user is on.
 *
 * URL shape: `?after=<id>&limit=<n>`. We use the row id as the cursor
 * — clients don't need to know about the secondary sort column. The
 * route handler reads the row by id on cursor-decode and builds the
 * tuple-comparison WHERE clause from the row's actual sort-column
 * value.
 *
 * Response shape: `{ items, nextCursor, total? }`. `total` is optional
 * because it requires a separate COUNT query — endpoints that show
 * "Showing N of M" still need it, endpoints that only need
 * Prev/Next/Load-More don't.
 *
 * Limitations:
 *   - Cursor pagination doesn't support arbitrary "jump to page 50".
 *     We accept this — at marketplace scale, deep-page jumps are a
 *     bad UX anyway (the user doesn't know what's on page 50).
 *   - The sort column must be deterministic (no ties beyond the id
 *     tiebreaker). `created_at` works because we add `id` as the
 *     secondary sort.
 */

import { z } from 'zod'

export interface KeysetPaginationParams {
  /** Row id from a previous response's `nextCursor`. Null on first page. */
  after: string | null
  /** Page size. Bounded by maxLimit. */
  limit: number
}

export interface KeysetResponse<T> {
  items: T[]
  /** Pass back as `?after=` for the next page. Null when there's no next page. */
  nextCursor: string | null
  /** Optional total — only set when the endpoint computed it. */
  total?: number
}

export const KEYSET_LIMIT_DEFAULT = 20
export const KEYSET_LIMIT_MAX = 100

const cursorIdSchema = z.string().uuid().optional()

/**
 * Parse `?after=<uuid>&limit=<n>` off a URL.
 *
 * limit is clamped to [1, maxLimit]; out-of-range values fall back to
 * `defaultLimit` rather than 400-ing — same forgiveness as the legacy
 * parsePagination helper.
 */
export function parseKeysetParams(
  request: Request,
  opts: { defaultLimit?: number; maxLimit?: number } = {},
): KeysetPaginationParams {
  const defaultLimit = opts.defaultLimit ?? KEYSET_LIMIT_DEFAULT
  const maxLimit = opts.maxLimit ?? KEYSET_LIMIT_MAX
  const url = new URL(request.url)

  const rawAfter = url.searchParams.get('after')
  const afterParse = cursorIdSchema.safeParse(rawAfter || undefined)
  const after = afterParse.success ? (afterParse.data ?? null) : null

  const rawLimit = Number(url.searchParams.get('limit'))
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(Math.floor(rawLimit), maxLimit)
    : defaultLimit

  return { after, limit }
}

/**
 * Compute the next cursor from a result slice.
 *
 * Given `items` returned for `limit = N`, the next cursor is the last
 * item's id WHEN we got the full `limit` (i.e. there's likely more).
 * If we got fewer than `limit`, there's no next page.
 *
 * Callers fetch `limit + 1` rows internally to disambiguate "got
 * exactly `limit`, might be the last page" from "definitely more" —
 * but for keyset there's no ambiguity worth paying that extra row
 * for. We accept the trailing "looks like a full page" edge case;
 * the client gets an empty next-page response and stops.
 */
export function buildNextCursor<T extends { id: string }>(
  items: T[],
  limit: number,
): string | null {
  if (items.length < limit) return null
  const last = items[items.length - 1]
  return last?.id ?? null
}
