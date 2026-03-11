import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewModerationLog } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'

export const PUT = withAdmin<{ id: string }>('reviews', async (request, session, context) => {
  const { id: reviewId } = context!.params!
  try {
    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'hide', 'delete', 'restore', 'flag_spam', 'flag_inappropriate'].includes(action)) {
      return apiBadRequest('Ungültige Moderations-Aktion')
    }

    if (!reason || typeof reason !== 'string') {
      return apiBadRequest('Moderations-Grund ist erforderlich')
    }

    // Get current review status
    const reviewRows = await db
      .select({ status: reviews.status })
      .from(reviews)
      .where(eq(reviews.id, reviewId))

    if (reviewRows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const oldStatus = reviewRows[0].status
    let newStatus = oldStatus

    // Determine new status based on action
    switch (action) {
      case 'approve':
        newStatus = REVIEW_STATUS.PUBLISHED
        break
      case 'hide':
        newStatus = REVIEW_STATUS.HIDDEN
        break
      case 'delete':
        newStatus = REVIEW_STATUS.DELETED
        break
      case 'restore':
        newStatus = REVIEW_STATUS.PUBLISHED
        break
      case 'flag_spam':
      case 'flag_inappropriate':
        newStatus = REVIEW_STATUS.HIDDEN
        break
    }

    // Update review status and moderation info
    await db
      .update(reviews)
      .set({
        status: newStatus,
        moderationReason: reason,
        moderatedBy: session.user.id,
        moderatedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(reviews.id, reviewId))

    // Log moderation action
    await db
      .insert(reviewModerationLog)
      .values({
        reviewId,
        action,
        reason,
        adminId: session.user.id,
        oldStatus,
        newStatus,
      })

    logger.info('Review moderated', {
      reviewId,
      action,
      oldStatus,
      newStatus,
      adminId: session.user.id
    })

    return apiSuccess({
      message: `Bewertung erfolgreich ${action === 'approve' ? 'freigegeben' : action === 'hide' ? 'ausgeblendet' : action === 'delete' ? 'gelöscht' : 'moderiert'}`,
      reviewId,
      action,
      oldStatus,
      newStatus
    })

  } catch (error) {
    logger.error('Error moderating review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
