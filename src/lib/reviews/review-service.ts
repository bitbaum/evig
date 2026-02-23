/**
 * Review Service
 *
 * Business logic for review creation side-effects:
 * - Target existence validation
 * - IT-Hilfe helper average rating updates
 * - Repairer review notification emails
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database'
import { APP_URL } from '@/config/urls'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'

// ─── Target Validation ─────────────────────────────────────────────

/**
 * Verify that the review target exists in the database.
 */
export async function validateReviewTarget(
  targetType: string,
  targetId: string
): Promise<boolean> {
  if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
    const result = await query(
      `SELECT id FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE id = $1 AND is_verified = true`,
      [targetId]
    )
    return result.rows.length > 0
  }

  if (targetType === 'service') {
    return true // Placeholder until services table exists
  }

  if (targetType === 'workshop') {
    const result = await query(
      `SELECT id FROM ${TABLE_NAMES.WORKSHOPS} WHERE id = $1`,
      [targetId]
    )
    return result.rows.length > 0
  }

  if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
    const result = await query(
      `SELECT id FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} WHERE id = $1 AND status = 'completed'`,
      [targetId]
    )
    return result.rows.length > 0
  }

  return false
}

// ─── IT-Hilfe Rating Update ─────────────────────────────────────────

/**
 * Recalculate and update the helper's average rating after a new IT-Hilfe review.
 */
export async function updateHelperAverageRating(targetId: string): Promise<void> {
  try {
    const helperResult = await query<{ helper_id: string }>(
      `SELECT o.helper_id
       FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
       JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON r.matched_offer_id = o.id
       WHERE r.id = $1`,
      [targetId]
    )

    if (helperResult.rows.length === 0) return

    const helperId = helperResult.rows[0].helper_id

    const avgResult = await query<{ avg_rating: string }>(
      `SELECT AVG(rev.overall_rating) as avg_rating
       FROM ${TABLE_NAMES.REVIEWS} rev
       JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} req ON rev.target_id = req.id
       JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} off ON req.matched_offer_id = off.id
       WHERE rev.target_type = $1
         AND rev.status = 'published'
         AND off.helper_id = $2`,
      [REVIEW_TARGET_TYPES.IT_HILFE, helperId]
    )

    const avgRating = avgResult.rows[0]?.avg_rating
    if (avgRating) {
      await query(
        `UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} SET average_rating = $1 WHERE user_id = $2`,
        [parseFloat(avgRating), helperId]
      )
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
    const repairerResult = await query<{
      business_name: string
      email: string
      repairer_name: string | null
    }>(
      `SELECT rp.business_name, u.email, u.name as repairer_name
       FROM ${TABLE_NAMES.REPAIRER_PROFILES} rp
       JOIN ${TABLE_NAMES.USERS} u ON rp.user_id = u.id
       WHERE rp.id = $1`,
      [targetId]
    )

    if (repairerResult.rows.length === 0) return

    const repairer = repairerResult.rows[0]
    const reviewUrl = `${APP_URL}/dashboard/repairer/reviews`

    const result = await sendEmail(
      repairer.email,
      'newReviewNotification',
      repairer.repairer_name || repairer.business_name || 'Reparateur',
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
