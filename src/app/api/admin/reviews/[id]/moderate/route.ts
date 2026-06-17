/**
 * PUT /api/admin/reviews/[id]/moderate
 * Body: { action: ReviewModerationAction, reason: string }
 *
 * Moderates a single review: transitions its status, records who/why on the
 * review, and appends an audit row to review_moderation_log. Staff-only via
 * withAdmin('reviews'). Used by useAdminReviews.handleModerate.
 */
import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewModerationLog } from '@/db/schema/reviews'
import { eq } from 'drizzle-orm'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { REVIEW_STATUS } from '@/config/review-status'

// Moderation action → resulting review status. Keys match
// REVIEW_ACTION_LABELS (src/config/review-status.ts) and the
// review_moderation_log CHECK constraint.
const ACTION_TO_STATUS: Record<string, string> = {
  approve: REVIEW_STATUS.PUBLISHED,
  restore: REVIEW_STATUS.PUBLISHED,
  hide: REVIEW_STATUS.HIDDEN,
  flag_spam: REVIEW_STATUS.HIDDEN,
  flag_inappropriate: REVIEW_STATUS.HIDDEN,
  delete: REVIEW_STATUS.DELETED,
}

export const PUT = withAdmin<{ id: string }>('reviews', async (request: NextRequest, session, context) => {
  const reviewId = context?.params?.id
  if (!reviewId) return apiBadRequest('Bewertungs-ID fehlt')

  const body = (await request.json().catch(() => ({}))) as { action?: string; reason?: string }
  const action = String(body.action ?? '')
  const reason = String(body.reason ?? '').trim()

  const newStatus = ACTION_TO_STATUS[action]
  if (!newStatus) return apiBadRequest('Ungültige Moderationsaktion')
  if (!reason) return apiBadRequest('Begründung erforderlich')

  try {
    const existing = await db
      .select({ status: reviews.status })
      .from(reviews)
      .where(eq(reviews.id, reviewId))
      .limit(1)

    if (existing.length === 0) return apiNotFound('Bewertung')
    const oldStatus = existing[0].status

    const now = new Date().toISOString()
    await db
      .update(reviews)
      .set({
        status: newStatus,
        moderationReason: reason,
        moderatedBy: session.user.id,
        moderatedAt: now,
        updatedAt: now,
      })
      .where(eq(reviews.id, reviewId))

    await db.insert(reviewModerationLog).values({
      reviewId,
      action,
      reason,
      adminId: session.user.id,
      oldStatus,
      newStatus,
    })

    return apiSuccess({ ok: true })
  } catch (error) {
    return apiError(error, 'Moderation fehlgeschlagen')
  }
})
