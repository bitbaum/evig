/**
 * GET /api/members/[id] — Public member (buyer) profile.
 *
 * A person's PUBLIC community reputation: reviews they have written and the
 * helpful votes those earned, plus member-since. This is the buyer-side half
 * of the trust loop — sellers are trusted via ratings received, members via
 * the reviews they contribute. All data returned here is already public
 * (reviewer names show on listing pages); this endpoint only collects it.
 *
 * Privacy: a profile exists ONLY for people with a public footprint — at least
 * one published review OR a seller profile. Purely-private accounts (bought
 * something, never reviewed, never sold) return 404, so accounts aren't
 * enumerable and no private data is ever exposed.
 */

import { NextRequest } from 'next/server';
import { apiSuccessCached, apiError, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { users, reviews, listings, sellerProfiles, userProfiles } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { REVIEW_TARGET_TYPES } from '@/config/database';
import { REVIEW_STATUS } from '@/config/review-status';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return apiNotFound('Profil');

    // Identity — 404 if the user doesn't exist at all. Public identity
    // (display_name / avatar / is_verified) comes from user_profiles, the SSOT.
    const [user] = await db
      .select({
        user_id: users.id,
        name: users.name,
        display_name: userProfiles.displayName,
        image: users.image,
        avatar_url: userProfiles.avatarUrl,
        is_verified: userProfiles.isVerified,
        member_since: users.createdAt,
      })
      .from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.id, id));

    if (!user) return apiNotFound('Profil');

    // Seller facet — only needed for the cross-link to their storefront.
    const [seller] = await db
      .select({ total_listings: sellerProfiles.totalListings })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, id));

    // Reviews written by this member. Left-join listings so a listing review
    // carries its title (a clickable reference); non-listing targets (service/
    // workshop) simply have a null title and render without a link.
    const reviewsWritten = await db
      .select({
        id: reviews.id,
        target_type: reviews.targetType,
        target_id: reviews.targetId,
        listing_title: listings.title,
        listing_status: listings.status,
        overall_rating: reviews.overallRating,
        title: reviews.title,
        content: reviews.content,
        helpful_votes: reviews.helpfulVotes,
        created_at: reviews.createdAt,
      })
      .from(reviews)
      .leftJoin(
        listings,
        and(eq(reviews.targetId, listings.id), eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING))
      )
      .where(and(eq(reviews.reviewerId, id), eq(reviews.status, REVIEW_STATUS.PUBLISHED)))
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(50);

    // Aggregate over ALL published reviews (not just the 50 returned).
    const [agg] = await db
      .select({
        reviews_written: sql<number>`COUNT(*)::int`,
        helpful_votes: sql<number>`COALESCE(SUM(${reviews.helpfulVotes}), 0)::int`,
      })
      .from(reviews)
      .where(and(eq(reviews.reviewerId, id), eq(reviews.status, REVIEW_STATUS.PUBLISHED)));

    const reviewsCount = agg?.reviews_written ?? 0;
    const isSeller = !!seller;

    // Privacy gate: no public footprint → no public profile.
    if (reviewsCount === 0 && !isSeller) return apiNotFound('Profil');

    // Public + semi-static → cache 60s, stale 30s.
    return apiSuccessCached(
      {
        profile: {
          user_id: user.user_id,
          // Prefer the person's chosen public name/avatar; fall back to account.
          name: user.display_name || user.name,
          image: user.avatar_url || user.image,
          member_since: user.member_since,
          is_verified: !!user.is_verified,
          is_seller: isSeller,
          seller_listings: seller?.total_listings ?? 0,
        },
        reviews: reviewsWritten,
        stats: {
          reviews_written: reviewsCount,
          helpful_votes: agg?.helpful_votes ?? 0,
        },
      },
      60,
      30
    );
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Profils');
  }
}
