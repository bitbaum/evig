/**
 * GET /api/sellers/[id] — Public seller profile with active listings + review stats
 */

import { NextRequest } from 'next/server';
import { apiSuccessCached, apiError, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { sellerProfiles, listings, users, reviews, reviewResponses, userProfiles } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { REVIEW_TARGET_TYPES } from '@/config/database';
import { REVIEW_STATUS } from '@/config/review-status';
import { LISTING_STATUS } from '@/config/marketplace';
import { listingThumbnailSubquery } from '@/lib/marketplace/listing-helpers';
import { sellerProfileCoreFields } from '@/lib/services/seller-service';

// ============================================================================
// GET — Public seller profile
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return apiNotFound('Verkäuferprofil');

    // Fetch seller profile joined with user data
    const [profile] = await db
      .select({
        ...sellerProfileCoreFields,
        user_name: users.name,
      })
      .from(sellerProfiles)
      .innerJoin(users, eq(sellerProfiles.userId, users.id))
      .leftJoin(userProfiles, eq(sellerProfiles.userId, userProfiles.userId))
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
        is_revampit: listings.isRevampit,
        pickup_location: listings.pickupLocation,
        verified_at: listings.verifiedAt,
        created_at: listings.createdAt,
        thumbnail: listingThumbnailSubquery,
      })
      .from(listings)
      .where(and(eq(listings.sellerId, id), eq(listings.status, LISTING_STATUS.ACTIVE)))
      .orderBy(sql`${listings.createdAt} DESC`);

    // One filter drives both review queries (DRY). Reviews are listing-scoped;
    // the seller page aggregates them to the person.
    const sellerReviewFilter = and(
      eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING),
      eq(listings.sellerId, id),
      eq(reviews.status, REVIEW_STATUS.PUBLISHED),
    );

    // The rating distribution is the SINGLE SOURCE for this seller's aggregate —
    // average + total are derived from it, so the review set is queried once.
    const [histogramRows, sellerReviews] = await Promise.all([
      db
        .select({ rating: reviews.overallRating, count: sql<string>`COUNT(*)` })
        .from(reviews)
        .innerJoin(listings, eq(reviews.targetId, listings.id))
        .where(sellerReviewFilter)
        .groupBy(reviews.overallRating),
      db
        .select({
          id: reviews.id,
          rating: reviews.overallRating,
          title: reviews.title,
          content: reviews.content,
          created_at: reviews.createdAt,
          is_verified_purchase: reviews.isVerifiedPurchase,
          reviewer_name: users.name,
          listing_id: listings.id,
          listing_title: listings.title,
          response_content: reviewResponses.content,
          response_created_at: reviewResponses.createdAt,
        })
        .from(reviews)
        .innerJoin(listings, eq(reviews.targetId, listings.id))
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .leftJoin(
          reviewResponses,
          and(eq(reviewResponses.reviewId, reviews.id), eq(reviewResponses.status, REVIEW_STATUS.PUBLISHED)),
        )
        .where(sellerReviewFilter)
        .orderBy(sql`${reviews.createdAt} DESC`)
        .limit(10),
    ]);

    const histogram: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    let totalReviews = 0;
    let ratingSum = 0;
    for (const row of histogramRows) {
      if (row.rating == null) continue;
      const count = Number(row.count);
      histogram[String(row.rating)] = count;
      totalReviews += count;
      ratingSum += row.rating * count;
    }
    const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 100) / 100 : 0;

    // Public seller profiles are semi-static — cache 60s, stale 30s
    return apiSuccessCached({
      profile,
      listings: activeListings,
      review_stats: {
        average_rating: averageRating,
        total_reviews: totalReviews,
        histogram,
      },
      reviews: sellerReviews,
    }, 60, 30);
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Verkäuferprofils');
  }
}
