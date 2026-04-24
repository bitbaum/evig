/**
 * GET /api/listings/favorites — Get user's favorited listings
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, parsePagination } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingFavorites, listingImages, users, sellerProfiles } from '@/db/schema';
import { eq, and, ne, sql } from 'drizzle-orm';
import { LISTING_STATUS } from '@/config/marketplace';
import { TABLE_NAMES } from '@/config/database';

export const GET = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const { limit, offset } = parsePagination(request, { defaultLimit: 20, maxLimit: 100 });

    // Count query
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listingFavorites)
      .innerJoin(listings, eq(listingFavorites.listingId, listings.id))
      .where(and(
        eq(listingFavorites.userId, session.user.id),
        ne(listings.status, LISTING_STATUS.REMOVED)
      ));
    const total = Number(countRow?.count ?? 0);

    const rows = await db
      .select({
        id: listings.id,
        title: listings.title,
        price_chf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        delivery_options: listings.deliveryOptions,
        payment_mode: listings.paymentMode,
        status: listings.status,
        is_revampit: listings.isRevampit,
        pickup_location: listings.pickupLocation,
        view_count: listings.viewCount,
        favorite_count: listings.favoriteCount,
        created_at: listings.createdAt,
        seller_name: users.name,
        seller_display_name: sellerProfiles.displayName,
        seller_city: sellerProfiles.city,
        thumbnail: sql<string | null>`(SELECT ${listingImages.url} FROM ${sql.raw(TABLE_NAMES.LISTING_IMAGES)} WHERE ${listingImages.listingId} = ${listings.id} AND ${listingImages.isPrimary} = true LIMIT 1)`,
        favorited_at: listingFavorites.createdAt,
      })
      .from(listingFavorites)
      .innerJoin(listings, eq(listingFavorites.listingId, listings.id))
      .innerJoin(users, eq(listings.sellerId, users.id))
      .leftJoin(sellerProfiles, eq(listings.sellerId, sellerProfiles.userId))
      .where(and(
        eq(listingFavorites.userId, session.user.id),
        ne(listings.status, LISTING_STATUS.REMOVED)
      ))
      .orderBy(sql`${listingFavorites.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return apiSuccess({
      items: rows,
      pagination: { total, limit, offset },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Favoriten');
  }
});
