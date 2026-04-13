import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses } from '@/db/schema/reviews'
import { repairerProfiles } from '@/db/schema/services'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'
import { validateBody, ReviewResponseSchema } from '@/lib/schemas'

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id: reviewId } = context!.params!

  try {
    const body = await request.json()
    const validation = validateBody(ReviewResponseSchema, body)
    if (!validation.success) return validation.error
    const { content } = validation.data

    // Get review and check if user can respond
    const reviewRows = await db
      .select({
        id: reviews.id,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        repairerUserId: repairerProfiles.userId,
      })
      .from(reviews)
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .where(eq(reviews.id, reviewId))

    if (reviewRows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewRows[0]

    // Check if user is the repairer being reviewed
    if (review.targetType === REVIEW_TARGET_TYPES.REPAIRER && review.repairerUserId !== session.user.id) {
      return apiForbidden('Nur der bewertete Reparateur kann auf Bewertungen antworten')
    }

    // Check if user is admin (admins can respond on behalf of repairers)
    const isAdmin = !!session.user.isStaff

    if (review.targetType !== REVIEW_TARGET_TYPES.REPAIRER && !isAdmin) {
      return apiForbidden('Antworten sind derzeit nur für Reparatur-Bewertungen verfügbar')
    }

    // Check if response already exists
    const existingResponse = await db
      .select({ id: reviewResponses.id })
      .from(reviewResponses)
      .where(eq(reviewResponses.reviewId, reviewId))

    if (existingResponse.length > 0) {
      return apiBadRequest('Eine Antwort für diese Bewertung existiert bereits')
    }

    // Create response
    const [createdResponse] = await db
      .insert(reviewResponses)
      .values({
        reviewId,
        responderId: session.user.id,
        content: content.trim(),
        status: REVIEW_STATUS.PUBLISHED,
      })
      .returning({ id: reviewResponses.id })

    logger.info('Review response created', {
      reviewId,
      responseId: createdResponse.id,
      responderId: session.user.id,
    })

    return apiSuccess({
      message: 'Antwort erfolgreich hinzugefügt',
      responseId: createdResponse.id,
    }, 201)

  } catch (error) {
    logger.error('Error creating review response', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const PUT = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id: reviewId } = context!.params!

  try {
    const body = await request.json()
    const validation = validateBody(ReviewResponseSchema, body)
    if (!validation.success) return validation.error
    const { content } = validation.data

    // Get response and check ownership
    const responseRows = await db
      .select({
        id: reviewResponses.id,
        responderId: reviewResponses.responderId,
        targetType: reviews.targetType,
        repairerUserId: repairerProfiles.userId,
      })
      .from(reviewResponses)
      .innerJoin(reviews, eq(reviewResponses.reviewId, reviews.id))
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .where(eq(reviewResponses.reviewId, reviewId))

    if (responseRows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const response = responseRows[0]

    // Check if user can edit this response
    const isAdmin = !!session.user.isStaff
    const isOwner = response.responderId === session.user.id
    const isRepairer = response.targetType === REVIEW_TARGET_TYPES.REPAIRER && response.repairerUserId === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Du kannst diese Antwort nicht bearbeiten')
    }

    // Update response
    await db
      .update(reviewResponses)
      .set({
        content: content.trim(),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(reviewResponses.reviewId, reviewId))

    logger.info('Review response updated', {
      reviewId,
      responderId: session.user.id,
    })

    return apiSuccess({
      message: 'Antwort erfolgreich aktualisiert',
    })

  } catch (error) {
    logger.error('Error updating review response', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

export const DELETE = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id: reviewId } = context!.params!

  try {
    // Get response and check ownership
    const responseRows = await db
      .select({
        responderId: reviewResponses.responderId,
        targetType: reviews.targetType,
        repairerUserId: repairerProfiles.userId,
      })
      .from(reviewResponses)
      .innerJoin(reviews, eq(reviewResponses.reviewId, reviews.id))
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .where(eq(reviewResponses.reviewId, reviewId))

    if (responseRows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const responseToDelete = responseRows[0]

    // Check if user can delete this response
    const isAdmin = !!session.user.isStaff
    const isOwner = responseToDelete.responderId === session.user.id
    const isRepairer = responseToDelete.targetType === REVIEW_TARGET_TYPES.REPAIRER && responseToDelete.repairerUserId === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Du kannst diese Antwort nicht löschen')
    }

    // Delete response
    await db
      .delete(reviewResponses)
      .where(eq(reviewResponses.reviewId, reviewId))

    logger.info('Review response deleted', {
      reviewId,
      deletedBy: session.user.id,
    })

    return apiSuccess({
      message: 'Antwort erfolgreich gelöscht',
    })

  } catch (error) {
    logger.error('Error deleting review response', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
