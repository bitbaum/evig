import { NextRequest } from 'next/server'
import { db } from '@/db'
import { repairerProfiles, reviews, reviewResponses, users } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { apiError, apiSuccessCached, apiNotFound } from '@/lib/api/helpers'
import { API_DEFAULTS } from '@/config/api-defaults'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: repairerId } = await params

  try {

    // Get repairer profile with rating summary
    const profileRows = await db
      .select({
        id: repairerProfiles.id,
        businessName: repairerProfiles.businessName,
        averageRating: repairerProfiles.averageRating,
        totalReviews: repairerProfiles.totalReviews,
      })
      .from(repairerProfiles)
      .where(and(
        eq(repairerProfiles.id, repairerId),
        eq(repairerProfiles.isVerified, true)
      ))

    if (profileRows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const profile = profileRows[0]

    // Get recent reviews (last 10) with reviewer name and optional response
    const recentReviews = await db
      .select({
        id: reviews.id,
        overallRating: reviews.overallRating,
        title: reviews.title,
        content: reviews.content,
        createdAt: reviews.createdAt,
        isVerifiedPurchase: reviews.isVerifiedPurchase,
        reviewerName: users.name,
        responseContent: reviewResponses.content,
        responseCreatedAt: reviewResponses.createdAt,
      })
      .from(reviews)
      .innerJoin(users, eq(reviews.reviewerId, users.id))
      .leftJoin(reviewResponses, and(
        eq(reviews.id, reviewResponses.reviewId),
        eq(reviewResponses.status, REVIEW_STATUS.PUBLISHED)
      ))
      .where(and(
        eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
        eq(reviews.targetId, repairerId),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED)
      ))
      .orderBy(desc(reviews.createdAt))
      .limit(API_DEFAULTS.RECENT_RATINGS_LIMIT)

    // Get rating breakdown
    const ratingBreakdownRows = await db
      .select({
        overallRating: reviews.overallRating,
        count: sql<string>`count(*)`,
      })
      .from(reviews)
      .where(and(
        eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
        eq(reviews.targetId, repairerId),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED)
      ))
      .groupBy(reviews.overallRating)
      .orderBy(desc(reviews.overallRating))

    const breakdownMap: Record<number, number> = {}
    for (const row of ratingBreakdownRows) {
      breakdownMap[row.overallRating] = parseInt(row.count)
    }

    const ratings = {
      overview: {
        averageRating: parseFloat(profile.averageRating ?? '0') || 0,
        totalReviews: profile.totalReviews ?? 0,
        ratingDistribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      },
      breakdown: {
        5: breakdownMap[5] || 0,
        4: breakdownMap[4] || 0,
        3: breakdownMap[3] || 0,
        2: breakdownMap[2] || 0,
        1: breakdownMap[1] || 0
      },
      detailedRatings: {
        communication: 0,
        professionalism: 0,
        quality: 0,
        timeliness: 0,
        value: 0
      },
      recentReviews: recentReviews.map(review => ({
        id: review.id,
        rating: review.overallRating,
        title: review.title,
        content: review.content,
        reviewerName: review.reviewerName,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt,
        response: review.responseContent ? {
          content: review.responseContent,
          createdAt: review.responseCreatedAt
        } : null
      }))
    }

    logger.info('Fetched repairer ratings', {
      repairerId,
      totalReviews: ratings.overview.totalReviews
    })

    // Ratings are public, change infrequently — cache 60s, stale 30s
    return apiSuccessCached({
      repairer: {
        id: profile.id,
        businessName: profile.businessName
      },
      ratings
    }, 60, 30)

  } catch (error) {
    logger.error('Error fetching repairer ratings', { error, repairerId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
