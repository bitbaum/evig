/**
 * GET /api/listings/mine — My listings (authenticated)
 *
 * Keyset-paginated: `?after=<uuid>&limit=<n>&status=<filter>`.
 *
 * Sort order: created_at DESC, id DESC. Cursor is the last item's id;
 * we look up that row to get its created_at and build a tuple-
 * comparison WHERE clause — clients never need to send the timestamp.
 *
 * Response shape: `{ items, nextCursor, total }`. total is included
 * so the UI can show "X Inserate" without a second round-trip; if it
 * proves to be the slow part at scale it can be dropped to an
 * on-demand endpoint.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings } from '@/db/schema';
import { eq, and, ne, or, lt, sql } from 'drizzle-orm';
import { LISTING_STATUS, LISTING_STATUSES } from '@/config/marketplace';
import { listingThumbnailSubquery } from '@/lib/marketplace/listing-helpers';
import { parseKeysetParams, buildNextCursor } from '@/lib/api/keyset';

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const { after, limit } = parseKeysetParams(request, { defaultLimit: 20, maxLimit: 100 });

    // Base filter (per-user + status).
    const baseConditions = [eq(listings.sellerId, session.user.id)];
    if (status && (LISTING_STATUSES as readonly string[]).includes(status)) {
      baseConditions.push(eq(listings.status, status));
    } else {
      baseConditions.push(ne(listings.status, LISTING_STATUS.REMOVED));
    }

    // Resolve the cursor row's created_at so we can build a proper
    // tuple comparison. If the cursor is gone (deleted in the
    // meantime) we treat it as "no cursor" — first page.
    // listings.created_at is mode: 'string' in Drizzle (ISO timestamp),
    // so the cursor value is a string too — Drizzle's lt()/eq() expect
    // matching string types.
    let afterCreatedAt: string | null = null;
    if (after) {
      const [row] = await db
        .select({ createdAt: listings.createdAt })
        .from(listings)
        .where(eq(listings.id, after))
        .limit(1);
      afterCreatedAt = row?.createdAt ?? null;
    }

    // Tuple comparison: (created_at, id) < (cursorTs, cursorId).
    // Expressed in normal SQL: created_at < cursorTs
    //                       OR (created_at = cursorTs AND id < cursorId).
    const cursorCondition = afterCreatedAt && after
      ? or(
          lt(listings.createdAt, afterCreatedAt),
          and(eq(listings.createdAt, afterCreatedAt), lt(listings.id, after)),
        )
      : undefined;

    const where = cursorCondition
      ? and(...baseConditions, cursorCondition)
      : and(...baseConditions);

    // Items + total in parallel — total is the seller's own count
    // (small N), so the extra round-trip is cheap. The keyset query
    // itself doesn't use a window-COUNT(*) trick (which would defeat
    // the keyset perf win on large tables); the separate COUNT lets
    // both queries stay simple.
    const [rows, countRow] = await Promise.all([
      db
        .select({
          id: listings.id,
          title: listings.title,
          price_chf: listings.priceChf,
          category: listings.category,
          condition: listings.condition,
          status: listings.status,
          view_count: listings.viewCount,
          favorite_count: listings.favoriteCount,
          created_at: listings.createdAt,
          updated_at: listings.updatedAt,
          thumbnail: listingThumbnailSubquery,
        })
        .from(listings)
        .where(where)
        .orderBy(sql`${listings.createdAt} DESC`, sql`${listings.id} DESC`)
        .limit(limit),
      db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(listings)
        .where(and(...baseConditions)),
    ]);

    return apiSuccess({
      items: rows,
      nextCursor: buildNextCursor(rows, limit),
      total: Number(countRow[0]?.total ?? 0),
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden Ihrer Inserate');
  }
});
