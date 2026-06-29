/**
 * Shared Review Creation Service — SSOT
 *
 * All review creation routes delegate to this function.
 * Handles: duplicate check, insert, and target rating update.
 */

import { db } from '@/db'
import { reviews } from '@/db/schema/reviews'
import { sellerProfiles } from '@/db/schema/marketplace'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { REVIEW_STATUS } from '@/config/review-status'
import { REVIEW_TARGET_TYPES, TABLE_NAMES } from '@/config/database'
import { OFFER_STATUS } from '@/config/it-hilfe'

interface CreateReviewParams {
  reviewerId: string
  targetType: string
  targetId: string
  overallRating: number
  content?: string | null
  bookingId?: string | null
  isVerifiedPurchase?: boolean
  title?: string | null
  communicationRating?: number | null
  professionalismRating?: number | null
  qualityRating?: number | null
  timelinessRating?: number | null
  valueRating?: number | null
}

/**
 * Check if a review already exists for this reviewer + target combination.
 */
export async function findDuplicateReview(
  reviewerId: string,
  targetType: string,
  targetId: string,
  bookingId?: string | null,
): Promise<boolean> {
  const conditions = [
    eq(reviews.reviewerId, reviewerId),
    eq(reviews.targetType, targetType),
    eq(reviews.targetId, targetId),
  ]
  if (bookingId) {
    conditions.push(eq(reviews.bookingId, bookingId))
  }

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(...conditions))

  return existing.length > 0
}

/**
 * Create a review and update the target's average rating.
 * Returns the new review ID.
 */
export async function createReview(params: CreateReviewParams): Promise<{ reviewId: string }> {
  const [inserted] = await db
    .insert(reviews)
    .values({
      reviewerId: params.reviewerId,
      targetType: params.targetType,
      targetId: params.targetId,
      bookingId: params.bookingId ?? undefined,
      overallRating: params.overallRating,
      communicationRating: params.communicationRating ?? undefined,
      professionalismRating: params.professionalismRating ?? undefined,
      qualityRating: params.qualityRating ?? undefined,
      timelinessRating: params.timelinessRating ?? undefined,
      valueRating: params.valueRating ?? undefined,
      title: params.title ?? undefined,
      content: params.content || '',
      isVerifiedPurchase: params.isVerifiedPurchase ?? false,
      status: REVIEW_STATUS.PUBLISHED,
    })
    .returning({ id: reviews.id })

  // Update target's average rating (fire-and-forget)
  updateTargetRating(params.targetType, params.targetId).catch(err =>
    logger.warn('Failed to update target rating', { error: err, targetType: params.targetType, targetId: params.targetId })
  )

  return { reviewId: inserted.id }
}

/**
 * Update the average rating for a review target.
 * Dispatches to the correct table based on target type.
 */
async function updateTargetRating(targetType: string, targetId: string): Promise<void> {
  switch (targetType) {
    case 'it_hilfe': {
      // Resolve the technician (accepted offer's helper) and recompute their
      // combined aggregate from ALL their reviews.
      const rows = await db.execute<{ helper_id: string }>(sql`
        SELECT helper_id FROM ${sql.raw(TABLE_NAMES.IT_HILFE_OFFERS)}
        WHERE request_id = ${targetId} AND status = ${OFFER_STATUS.ACCEPTED} LIMIT 1
      `)
      const helperId = rows.rows[0]?.helper_id
      if (helperId) await recomputeTechnicianAggregate(helperId)
      break
    }
    case 'listing':
      await updateSellerRatingFromListing(targetId)
      break
    case 'repairer': {
      // target_id is the repairer_profiles.id — resolve its user, recompute.
      const rows = await db.execute<{ user_id: string }>(sql`
        SELECT user_id FROM ${sql.raw(TABLE_NAMES.REPAIRER_PROFILES)} WHERE id = ${targetId} LIMIT 1
      `)
      const userId = rows.rows[0]?.user_id
      if (userId) await recomputeTechnicianAggregate(userId)
      break
    }
    default:
      logger.info('No rating update for target type', { targetType })
  }
}

/**
 * Single source of truth for a technician's rating: recompute
 * repairer_profiles.average_rating / total_reviews from ALL of their reviews in
 * the `reviews` table — IT-Hilfe (via accepted offer → helper) AND repairer
 * (via target_id → profile, which now also includes mirrored service-appointment
 * ratings). Replaces the two slice-specific updaters that overwrote each other.
 */
export async function recomputeTechnicianAggregate(technicianUserId: string): Promise<void> {
  const result = await db.execute(sql`
    UPDATE ${sql.raw(TABLE_NAMES.REPAIRER_PROFILES)} p SET
      average_rating = sub.avg_rating,
      total_reviews = sub.review_count
    FROM (
      SELECT u AS user_id, AVG(rating)::numeric(3,2) AS avg_rating, COUNT(*)::int AS review_count
      FROM (
        SELECT o.helper_id AS u, r.overall_rating AS rating
        FROM ${sql.raw(TABLE_NAMES.REVIEWS)} r
        JOIN ${sql.raw(TABLE_NAMES.IT_HILFE_OFFERS)} o
          ON o.request_id = r.target_id AND o.status = ${OFFER_STATUS.ACCEPTED}
        WHERE r.target_type = ${REVIEW_TARGET_TYPES.IT_HILFE} AND r.status = ${REVIEW_STATUS.PUBLISHED}
        UNION ALL
        SELECT p2.user_id AS u, r.overall_rating AS rating
        FROM ${sql.raw(TABLE_NAMES.REVIEWS)} r
        JOIN ${sql.raw(TABLE_NAMES.REPAIRER_PROFILES)} p2 ON p2.id = r.target_id
        WHERE r.target_type = ${REVIEW_TARGET_TYPES.REPAIRER} AND r.status = ${REVIEW_STATUS.PUBLISHED}
      ) all_reviews
      WHERE u = ${technicianUserId}
      GROUP BY u
    ) sub
    WHERE p.user_id = sub.user_id
  `)
  logger.info('Recomputed technician aggregate', { technicianUserId, rows: result.rowCount })
}

/** Update seller_profiles average rating from all listing reviews for that seller */
async function updateSellerRatingFromListing(listingId: string): Promise<void> {
  const result = await db.execute(sql`
    UPDATE ${sql.raw(TABLE_NAMES.SELLER_PROFILES)} SET
      average_rating = sub.avg_rating,
      total_reviews = sub.review_count
    FROM (
      SELECT
        l.seller_id,
        AVG(r.overall_rating)::numeric(3,2) AS avg_rating,
        COUNT(r.id)::int AS review_count
      FROM ${sql.raw(TABLE_NAMES.REVIEWS)} r
      JOIN ${sql.raw(TABLE_NAMES.LISTINGS)} l ON l.id = r.target_id
      WHERE r.target_type = ${REVIEW_TARGET_TYPES.LISTING} AND r.status = ${REVIEW_STATUS.PUBLISHED}
      GROUP BY l.seller_id
    ) sub
    WHERE ${sql.raw(TABLE_NAMES.SELLER_PROFILES)}.user_id = sub.seller_id
    AND sub.seller_id = (SELECT seller_id FROM ${sql.raw(TABLE_NAMES.LISTINGS)} WHERE id = ${listingId})
  `)
  logger.info('Updated seller rating from listing', { listingId, rows: result.rowCount })
}
