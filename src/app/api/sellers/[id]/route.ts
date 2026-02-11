/**
 * GET /api/sellers/[id] — Public seller profile with active listings + review stats
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError, apiNotFound } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database';

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
    const profileResult = await query<Record<string, unknown>>(
      `SELECT
        sp.id,
        sp.user_id,
        sp.display_name,
        sp.bio,
        sp.avatar_url,
        sp.city,
        sp.canton,
        sp.is_verified,
        sp.average_rating,
        sp.total_reviews,
        sp.total_listings,
        sp.total_sold,
        sp.created_at,
        u.name as user_name
      FROM ${TABLE_NAMES.SELLER_PROFILES} sp
      JOIN ${TABLE_NAMES.USERS} u ON sp.user_id = u.id
      WHERE sp.user_id = $1`,
      [id]
    );

    if (profileResult.rows.length === 0) {
      return apiNotFound('Verkäuferprofil');
    }

    const profile = profileResult.rows[0];

    // Fetch active listings with primary image thumbnail
    const listingsResult = await query<Record<string, unknown>>(
      `SELECT
        l.id, l.title, l.price_chf, l.category, l.condition, l.brand, l.model,
        l.created_at,
        (SELECT li.url
         FROM ${TABLE_NAMES.LISTING_IMAGES} li
         WHERE li.listing_id = l.id AND li.is_primary = true
         LIMIT 1) as thumbnail
      FROM ${TABLE_NAMES.LISTINGS} l
      WHERE l.seller_id = $1 AND l.status = 'active'
      ORDER BY l.created_at DESC`,
      [id]
    );

    // Aggregate review stats from reviews where target_type='listing'
    // and the listing belongs to this seller
    const reviewStatsResult = await query<{
      avg_rating: number | null;
      review_count: string;
    }>(
      `SELECT
        ROUND(AVG(r.overall_rating)::numeric, 2) as avg_rating,
        COUNT(r.id) as review_count
      FROM ${TABLE_NAMES.REVIEWS} r
      JOIN ${TABLE_NAMES.LISTINGS} l ON r.target_id = l.id
      WHERE r.target_type = $1
        AND l.seller_id = $2
        AND r.status = 'published'`,
      [REVIEW_TARGET_TYPES.LISTING, id]
    );

    const reviewStats = reviewStatsResult.rows[0];

    return apiSuccess({
      profile,
      listings: listingsResult.rows,
      review_stats: {
        average_rating: reviewStats?.avg_rating ? Number(reviewStats.avg_rating) : 0,
        total_reviews: reviewStats?.review_count ? Number(reviewStats.review_count) : 0,
      },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden des Verkäuferprofils');
  }
}
