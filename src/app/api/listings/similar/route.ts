/**
 * GET /api/listings/similar?listing_id=X&limit=4
 *
 * Returns similar listings based on same category and similar price range.
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiBadRequest, parsePagination } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages } from '@/db/schema';
import { eq, and, ne, sql, desc } from 'drizzle-orm';
import { LISTING_STATUS } from '@/config/marketplace';
import { TABLE_NAMES } from '@/config/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listing_id');
    const { limit } = parsePagination(request, { defaultLimit: 4, maxLimit: 12 });

    if (!listingId) return apiBadRequest('listing_id ist erforderlich');

    // Get the source listing for comparison
    const [source] = await db
      .select({ category: listings.category, priceChf: listings.priceChf })
      .from(listings)
      .where(eq(listings.id, listingId));

    if (!source) {
      return apiSuccess([]);
    }

    const price = Number(source.priceChf);
    const priceRange = price * 0.5; // +-50% price range

    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        price_chf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        view_count: listings.viewCount,
        favorite_count: listings.favoriteCount,
        created_at: listings.createdAt,
        thumbnail: sql<string | null>`(SELECT ${listingImages.url} FROM ${sql.raw(TABLE_NAMES.LISTING_IMAGES)} WHERE ${listingImages.listingId} = ${listings.id} AND ${listingImages.isPrimary} = true LIMIT 1)`,
      })
      .from(listings)
      .where(and(
        ne(listings.id, listingId),
        eq(listings.status, LISTING_STATUS.ACTIVE),
        eq(listings.category, source.category),
        sql`${listings.priceChf}::numeric BETWEEN ${Math.max(0, price - priceRange)} AND ${price + priceRange}`
      ))
      .orderBy(desc(listings.viewCount))
      .limit(limit);

    return apiSuccess(rows);
  } catch (error) {
    return apiError(error, 'Fehler beim Laden ähnlicher Inserate');
  }
}
