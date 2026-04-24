/**
 * GET /api/listings/mine — My listings (authenticated)
 *
 * Returns the current user's listings with optional status filter and pagination.
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, parsePagination } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { LISTING_STATUS, LISTING_STATUSES } from '@/config/marketplace';
import { TABLE_NAMES } from '@/config/database';

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const { limit, offset, page } = parsePagination(request, { defaultLimit: 20, maxLimit: 100 });

    // Build conditions
    const conditions = [eq(listings.sellerId, session.user.id)];

    if (status && (LISTING_STATUSES as readonly string[]).includes(status)) {
      conditions.push(eq(listings.status, status));
    } else {
      conditions.push(ne(listings.status, LISTING_STATUS.REMOVED));
    }

    const where = and(...conditions);

    const rows = await db
      .select({
        _total: sql<number>`count(*) over()`,
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
        thumbnail: sql<string | null>`(SELECT ${listingImages.url} FROM ${sql.raw(TABLE_NAMES.LISTING_IMAGES)} WHERE ${listingImages.listingId} = ${listings.id} AND ${listingImages.isPrimary} = true LIMIT 1)`,
      })
      .from(listings)
      .where(where)
      .orderBy(sql`${listings.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    const total = Number(rows[0]?._total ?? 0);
    const totalPages = Math.ceil(total / limit);
    const items = rows.map(({ _total, ...rest }) => rest);

    return apiSuccess({
      items,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden Ihrer Inserate');
  }
});
