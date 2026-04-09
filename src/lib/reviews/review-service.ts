/**
 * Review Service
 *
 * Business logic for review creation side-effects:
 * - Target existence validation
 * - IT-Hilfe helper average rating updates
 * - Repairer review notification emails
 */

import { db } from '@/db'
import {
  repairerProfiles, listings, workshops, reviews,
  itHilfeRequests, itHilfeOffers, helperProfiles, users,
} from '@/db/schema'
import { eq, and, sql, getTableName } from 'drizzle-orm'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { APP_URL } from '@/config/urls'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { REVIEW_STATUS } from '@/config/review-status'

// Table name refs for raw SQL joins
const reviewsTable = getTableName(reviews)
const itHilfeRequestsTable = getTableName(itHilfeRequests)
const itHilfeOffersTable = getTableName(itHilfeOffers)

// ─── Target Validation ─────────────────────────────────────────────

/**
 * Verify that the review target exists in the database.
 */
export async function validateReviewTarget(
  targetType: string,
  targetId: string
): Promise<boolean> {
  if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
    const result = await db
      .select({ id: repairerProfiles.id })
      .from(repairerProfiles)
      .where(and(eq(repairerProfiles.id, targetId), eq(repairerProfiles.isVerified, true)))
    return result.length > 0
  }

  if (targetType === REVIEW_TARGET_TYPES.LISTING) {
    const result = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, targetId))
    return result.length > 0
  }

  if (targetType === REVIEW_TARGET_TYPES.SERVICE) {
    return true // Placeholder until services table exists
  }

  if (targetType === REVIEW_TARGET_TYPES.WORKSHOP) {
    const result = await db
      .select({ id: workshops.id })
      .from(workshops)
      .where(eq(workshops.id, targetId))
    return result.length > 0
  }

  if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
    const result = await db
      .select({ id: itHilfeRequests.id })
      .from(itHilfeRequests)
      .where(and(eq(itHilfeRequests.id, targetId), eq(itHilfeRequests.status, REQUEST_STATUS.COMPLETED)))
    return result.length > 0
  }

  return false
}

// ─── IT-Hilfe Rating Update ─────────────────────────────────────────

/**
 * Recalculate and update the helper's average rating after a new IT-Hilfe review.
 */
export async function updateHelperAverageRating(targetId: string): Promise<void> {
  try {
    // Find the helper via request -> matched_offer -> helper
    const helperResult = await db
      .select({ helperId: itHilfeOffers.helperId })
      .from(itHilfeOffers)
      .innerJoin(itHilfeRequests, eq(itHilfeRequests.matchedOfferId, itHilfeOffers.id))
      .where(eq(itHilfeRequests.id, targetId))

    if (helperResult.length === 0) return

    const helperId = helperResult[0].helperId

    // Calculate average rating across all published IT-Hilfe reviews for this helper
    const avgResult = await db.execute(sql`
      SELECT AVG(rev.overall_rating) as avg_rating
      FROM ${sql.raw(reviewsTable)} rev
      JOIN ${sql.raw(itHilfeRequestsTable)} req ON rev.target_id = req.id::text
      JOIN ${sql.raw(itHilfeOffersTable)} off ON req.matched_offer_id = off.id
      WHERE rev.target_type = ${REVIEW_TARGET_TYPES.IT_HILFE}
        AND rev.status = ${REVIEW_STATUS.PUBLISHED}
        AND off.helper_id = ${helperId}
    `)

    const avgRating = (avgResult.rows as unknown as { avg_rating: string | null }[])[0]?.avg_rating
    if (avgRating) {
      await db
        .update(helperProfiles)
        .set({ averageRating: String(parseFloat(avgRating)) })
        .where(eq(helperProfiles.userId, helperId))
    }
  } catch (error) {
    logger.error('Error updating helper average rating', { error, targetId })
  }
}

// ─── Repairer Notification ──────────────────────────────────────────

/**
 * Send a notification email to the repairer about a new review.
 */
export async function notifyRepairerOfReview(
  targetId: string,
  reviewId: string,
  reviewerName: string,
  overallRating: number,
  content: string
): Promise<void> {
  try {
    const repairerResult = await db
      .select({
        businessName: repairerProfiles.businessName,
        email: users.email,
        repairerName: users.name,
      })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .where(eq(repairerProfiles.id, targetId))

    if (repairerResult.length === 0) return

    const repairer = repairerResult[0]
    const reviewUrl = `${APP_URL}/dashboard/reviews`

    const result = await sendEmail(
      repairer.email,
      'newReviewNotification',
      repairer.repairerName || repairer.businessName || 'Techniker',
      reviewerName,
      overallRating,
      content,
      reviewUrl
    )

    if (!result.success) {
      logger.warn('Failed to send new review notification', {
        reviewId,
        repairerEmail: repairer.email,
        error: result.error,
      })
    }
  } catch (error) {
    logger.error('Error sending review notification', { error, reviewId })
  }
}
