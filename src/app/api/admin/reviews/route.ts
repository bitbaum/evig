/**
 * Reviews List API
 *
 * GET /api/admin/reviews
 * Lists all reviews with optional filtering by status
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, reviewResponses, users } from '@/db/schema'
import { eq, sql, count, aliasedTable } from 'drizzle-orm'
import { apiError, apiSuccess, parsePagination } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'

export const GET = withAdmin('reviews', async (request, session) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || REVIEW_STATUS.PENDING_MODERATION
    const { limit, offset } = parsePagination(request)

    // Alias for the responder user join
    const responderUser = aliasedTable(users, 'responder_user')

    // Fetch reviews with optional response data
    const reviewRows = await db
      .select({
        id: reviews.id,
        reviewerId: reviews.reviewerId,
        reviewerName: sql<string>`COALESCE(${users.name}, 'Unbekannt')`,
        reviewerEmail: sql<string>`COALESCE(${users.email}, '')`,
        targetType: reviews.targetType,
        targetId: reviews.targetId,
        overallRating: reviews.overallRating,
        title: reviews.title,
        content: reviews.content,
        status: reviews.status,
        helpfulVotes: reviews.helpfulVotes,
        totalVotes: reviews.totalVotes,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        moderationReason: reviews.moderationReason,
        moderatedBy: reviews.moderatedBy,
        moderatedAt: reviews.moderatedAt,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        responseContent: reviewResponses.content,
        responseResponderName: responderUser.name,
        responseCreatedAt: reviewResponses.createdAt,
      })
      .from(reviews)
      .leftJoin(users, eq(users.id, reviews.reviewerId))
      .leftJoin(reviewResponses, eq(reviewResponses.reviewId, reviews.id))
      .leftJoin(responderUser, eq(responderUser.id, reviewResponses.responderId))
      .where(eq(reviews.status, status))
      .orderBy(sql`${reviews.createdAt} DESC`)
      .limit(limit)
      .offset(offset)

    // Separate count query for total
    const [{ total }] = await db
      .select({ total: count() })
      .from(reviews)
      .where(eq(reviews.status, status))

    // Transform for frontend
    const reviewList = reviewRows.map(row => ({
      id: row.id,
      reviewerId: row.reviewerId,
      reviewerName: row.reviewerName,
      reviewerEmail: row.reviewerEmail,
      targetType: row.targetType,
      targetId: row.targetId,
      targetName: 'Unbekannt',
      overallRating: row.overallRating,
      title: row.title,
      content: row.content,
      status: row.status,
      helpfulVotes: row.helpfulVotes,
      totalVotes: row.totalVotes,
      isVerifiedPurchase: row.isVerifiedPurchase,
      moderationReason: row.moderationReason,
      moderatedBy: row.moderatedBy,
      moderatedAt: row.moderatedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      response: row.responseContent ? {
        content: row.responseContent,
        responderName: row.responseResponderName,
        createdAt: row.responseCreatedAt
      } : undefined
    }))

    logger.info('Reviews fetched', {
      userId: session.user.id,
      status,
      count: reviewList.length,
      total
    })

    return apiSuccess({ reviews: reviewList, total })

  } catch (error) {
    logger.error('Error fetching reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
