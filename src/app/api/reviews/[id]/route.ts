import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses, reviewAttachments, reviewModerationLog } from '@/db/schema/reviews'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'
import { validateBody, UpdateReviewSchema } from '@/lib/schemas'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const session = await auth()
    const isAdmin = !!session?.user?.isStaff

    // Aliased users table for responder
    const responder = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .as('responder')

    // Subquery for published response
    const publishedResponses = db
      .select({
        reviewId: reviewResponses.reviewId,
        id: reviewResponses.id,
        content: reviewResponses.content,
        createdAt: reviewResponses.createdAt,
        responderId: reviewResponses.responderId,
      })
      .from(reviewResponses)
      .where(eq(reviewResponses.status, REVIEW_STATUS.PUBLISHED))
      .as('rr')

    const rows = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        bookingId: reviews.bookingId,
        overallRating: reviews.overallRating,
        communicationRating: reviews.communicationRating,
        professionalismRating: reviews.professionalismRating,
        qualityRating: reviews.qualityRating,
        timelinessRating: reviews.timelinessRating,
        valueRating: reviews.valueRating,
        title: reviews.title,
        content: reviews.content,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        status: reviews.status,
        moderationReason: reviews.moderationReason,
        moderatedBy: reviews.moderatedBy,
        moderatedAt: reviews.moderatedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        reviewerName: users.name,
        reviewerEmail: users.email,
        targetName: sql<string>`COALESCE(${repairerProfiles.businessName}, '')`,
        responseId: publishedResponses.id,
        responseContent: publishedResponses.content,
        responseCreatedAt: publishedResponses.createdAt,
        responderName: responder.name,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .leftJoin(publishedResponses, eq(reviews.id, publishedResponses.reviewId))
      .leftJoin(responder, eq(publishedResponses.responderId, responder.id))
      .where(eq(reviews.id, reviewId))

    if (rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REVIEW_NOT_FOUND)
    }

    const review = rows[0]

    // Non-published reviews require admin
    if (review.status !== REVIEW_STATUS.PUBLISHED && !isAdmin) {
      return apiNotFound(ERROR_MESSAGES.REVIEW_NOT_FOUND)
    }

    // Get attachments
    const attachmentRows = await db
      .select({
        id: reviewAttachments.id,
        originalFilename: reviewAttachments.originalFilename,
        filePath: reviewAttachments.filePath,
        mimeType: reviewAttachments.mimeType,
        attachmentType: reviewAttachments.attachmentType,
      })
      .from(reviewAttachments)
      .where(eq(reviewAttachments.reviewId, reviewId))
      .orderBy(reviewAttachments.sortOrder, reviewAttachments.createdAt)

    const reviewData: Record<string, unknown> = {
      id: review.id,
      reviewerId: review.reviewerId,
      reviewerName: review.reviewerName,
      targetType: review.targetType,
      targetId: review.targetId,
      targetName: review.targetName,
      bookingId: review.bookingId,
      overallRating: review.overallRating,
      ratings: {
        communication: review.communicationRating,
        professionalism: review.professionalismRating,
        quality: review.qualityRating,
        timeliness: review.timelinessRating,
        value: review.valueRating,
      },
      title: review.title,
      content: review.content,
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulVotes: review.helpfulVotes,
      totalVotes: review.totalVotes,
      status: review.status,
      attachments: attachmentRows.map(att => ({
        id: att.id,
        filename: att.originalFilename,
        filePath: att.filePath,
        mimeType: att.mimeType,
        attachmentType: att.attachmentType,
      })),
      response: review.responseId ? {
        id: review.responseId,
        content: review.responseContent,
        createdAt: review.responseCreatedAt,
        responderName: review.responderName,
      } : null,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }

    // Only expose sensitive moderation fields to admin
    if (isAdmin) {
      reviewData.reviewerEmail = review.reviewerEmail
      reviewData.moderationReason = review.moderationReason
      reviewData.moderatedBy = review.moderatedBy
      reviewData.moderatedAt = review.moderatedAt
    }

    return apiSuccess({ review: reviewData })

  } catch (error) {
    logger.error('Error fetching review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export const PUT = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  const { id: reviewId } = context!.params!

  try {
    const body = await request.json()
    const validation = validateBody(UpdateReviewSchema, body)
    if (!validation.success) return validation.error
    const {
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      timelinessRating,
      valueRating,
      title,
      content,
    } = validation.data

    // Get review and check ownership
    const existingRows = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        createdAt: reviews.createdAt,
        status: reviews.status,
      })
      .from(reviews)
      .where(eq(reviews.id, reviewId))

    if (existingRows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REVIEW_NOT_FOUND)
    }

    const review = existingRows[0]

    // Check if user owns this review
    if (review.reviewerId !== session.user.id) {
      return apiForbidden('Du kannst nur deine eigenen Bewertungen bearbeiten')
    }

    // Check if review can still be edited (within time limit, e.g., 30 days)
    const createdAt = new Date(review.createdAt!)
    const now = new Date()
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceCreation > 30) {
      return apiBadRequest('Bewertungen können nur innerhalb von 30 Tagen bearbeitet werden')
    }

    // Build partial update — only include fields that were provided
    const updateFields: Record<string, unknown> = {
      updatedAt: sql`CURRENT_TIMESTAMP`,
    }
    if (overallRating !== undefined) updateFields.overallRating = overallRating
    if (communicationRating !== undefined) updateFields.communicationRating = communicationRating
    if (professionalismRating !== undefined) updateFields.professionalismRating = professionalismRating
    if (qualityRating !== undefined) updateFields.qualityRating = qualityRating
    if (timelinessRating !== undefined) updateFields.timelinessRating = timelinessRating
    if (valueRating !== undefined) updateFields.valueRating = valueRating
    if (title !== undefined) updateFields.title = title
    if (content !== undefined) updateFields.content = content

    await db
      .update(reviews)
      .set(updateFields)
      .where(eq(reviews.id, reviewId))

    logger.info('Review updated', {
      reviewId,
      reviewerId: session.user.id,
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich aktualisiert',
      reviewId,
    })

  } catch (error) {
    logger.error('Error updating review', { error, reviewId })
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
    // Get review and check ownership
    const existingRows = await db
      .select({ reviewerId: reviews.reviewerId })
      .from(reviews)
      .where(eq(reviews.id, reviewId))

    if (existingRows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REVIEW_NOT_FOUND)
    }

    const review = existingRows[0]

    // Check if user owns this review or is admin
    const isAdmin = !!session.user.isStaff
    const isOwner = review.reviewerId === session.user.id

    if (!isOwner && !isAdmin) {
      return apiForbidden('Du kannst nur deine eigenen Bewertungen löschen')
    }

    // Soft delete by setting status to 'deleted'
    await db
      .update(reviews)
      .set({
        status: REVIEW_STATUS.DELETED,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(reviews.id, reviewId))

    // Log moderation action if admin
    if (isAdmin && !isOwner) {
      await db
        .insert(reviewModerationLog)
        .values({
          reviewId,
          action: 'delete',
          reason: 'User requested deletion',
          adminId: session.user.id,
          oldStatus: REVIEW_STATUS.PUBLISHED,
          newStatus: REVIEW_STATUS.DELETED,
        })
    }

    logger.info('Review deleted', {
      reviewId,
      deletedBy: session.user.id,
      isAdmin,
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich gelöscht',
      reviewId,
    })

  } catch (error) {
    logger.error('Error deleting review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
