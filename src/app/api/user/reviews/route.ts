import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses } from '@/db/schema/reviews'
import { users } from '@/db/schema/auth'
import { repairerProfiles } from '@/db/schema/services'
import { workshops } from '@/db/schema/workshops'
import { eq, and, sql, count, desc } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_STATUS } from '@/config/review-status'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const { limit, offset } = parsePagination(request)

    // Build where conditions
    const conditions = [eq(reviews.reviewerId, session.user.id)]
    if (status !== 'all') {
      conditions.push(eq(reviews.status, status))
    }

    const whereClause = and(...conditions)

    // Subquery for published responses
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

    const responder = db
      .select({ id: users.id, name: users.name })
      .from(users)
      .as('responder')

    // Get user's reviews with responses
    const reviewRows = await db
      .select({
        id: reviews.id,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        targetName: sql<string>`COALESCE(${repairerProfiles.businessName}, ${workshops.title}, 'Unbekannt')`,
        overallRating: reviews.overallRating,
        communicationRating: reviews.communicationRating,
        professionalismRating: reviews.professionalismRating,
        qualityRating: reviews.qualityRating,
        timelinessRating: reviews.timelinessRating,
        valueRating: reviews.valueRating,
        title: reviews.title,
        content: reviews.content,
        status: reviews.status,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        responseId: publishedResponses.id,
        responseContent: publishedResponses.content,
        responseCreatedAt: publishedResponses.createdAt,
        responderName: responder.name,
      })
      .from(reviews)
      .leftJoin(
        repairerProfiles,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
          eq(reviews.targetId, repairerProfiles.id)
        )
      )
      .leftJoin(
        workshops,
        and(
          eq(reviews.targetType, REVIEW_TARGET_TYPES.WORKSHOP),
          eq(reviews.targetId, workshops.id)
        )
      )
      .leftJoin(publishedResponses, eq(reviews.id, publishedResponses.reviewId))
      .leftJoin(responder, eq(publishedResponses.responderId, responder.id))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [countRow] = await db
      .select({ total: count() })
      .from(reviews)
      .where(whereClause)

    const total = countRow?.total ?? 0

    const reviewList = reviewRows.map(review => ({
      id: review.id,
      targetType: review.targetType,
      targetId: review.targetId,
      targetName: review.targetName,
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
      status: review.status,
      helpfulVotes: review.helpfulVotes,
      totalVotes: review.totalVotes,
      isVerifiedPurchase: review.isVerifiedPurchase,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      response: review.responseId ? {
        id: review.responseId,
        content: review.responseContent,
        responderName: review.responderName,
        createdAt: review.responseCreatedAt,
      } : null,
    }))

    logger.info('Fetched user reviews', {
      userId: session.user.id,
      count: reviewList.length,
      status,
    })

    return apiSuccess({
      reviews: reviewList,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })

  } catch (error) {
    logger.error('Error fetching user reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
