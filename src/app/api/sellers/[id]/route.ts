/**
 * GET /api/sellers/[id] — Public seller profile with active listings + review stats
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { sellerProfiles, listings, listingImages, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database';
import { REVIEW_STATUS } from '@/config/review-status';

// ============================================================================
// GET — Public seller profile
// ============================================================================

export async function GET(
  request: NextRequest,
  context: { params?: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = context.params ? await context.params : undefined;
    const id = resolvedParams?.id;
    if (!id) return apiNotFound('Verkäuferprofil');

    // Fetch seller profile joined with user data
    const [profile] = await db
      .select({
        id: sellerProfiles.id,
        user_id: sellerProfiles.userId,
        display_name: sellerProfiles.displayName,
        bio: sellerProfiles.bio,
        avatar_url: sellerProfiles.avatarUrl,
        city: sellerProfiles.city,
        canton: sellerProfiles.canton,
        is_verified: sellerProfiles.isVerified,
        average_rating: sellerProfiles.averageRating,
        total_reviews: sellerProfiles.totalReviews,
        total_listings: sellerProfiles.totalListings,
        total_sold: sellerProfiles.totalSold,
        created_at: sellerProfiles.createdAt,
        user_name: users.name,
      })
      .from(sellerProfiles)
      .innerJoin(users, eq(sellerProfiles.userId, users.id))
      .where(eq(sellerProfiles.userId, id));

    if (!profile) {
      return apiNotFound('Verkäuferprofil');
    }

    // Fetch active listings with primary image thumbnail
    const activeListings = await db
      .select({
        id: listings.id,
        title: listings.title,
        price_chf: listings.priceChf,
        category: listings.category,
        condition: listings.condition,
        brand: listings.brand,
        model: listings.model,
        created_at: listings.createdAt,
        thumbnail: sql<string | null>`(
          SELECT ${listingImages.url}
          FROM ${listingImages}
          WHERE ${listingImages.listingId} = ${listings.id} AND ${listingImages.isPrimary} = true
          LIMIT 1
        )`,
      })
      .from(listings)
      .where(and(eq(listings.sellerId, id), eq(listings.status, 'active')))
      .orderBy(sql`${listings.createdAt} DESC`);

    // Aggregate review stats — reviews table has no Drizzle schema, use raw SQL
    const reviewStatsResult = await db.execute(sql`
      SELECT
        ROUND(AVG(r.overall_rating)::numeric, 2) as avg_rating,
        COUNT(r.id) as review_count
      FROM ${sql.raw(TABLE_NAMES.REVIEWS)} r
      JOIN ${listings} l ON r.target_id = l.id
      WHERE r.target_type = ${REVIEW_TARGET_TYPES.LISTING}
        AND l.seller_id = ${id}
        AND r.status = ${REVIEW_STATUS.PUBLISHED}
    `);

    const reviewStats = reviewStatsResult.rows[0] as { avg_rating: string | null; review_count: string } | undefined;

    return apiSuccess({
      profile,
      listings: activeListings,
      review_stats: {
        average_rating: reviewStats?.avg_rating ? Number(reviewStats.avg_rating) : 0,
        total_reviews: reviewStats?.review_count ? Number(reviewStats.review_count) : 0,
      },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Verkäuferprofils');
  }
}
