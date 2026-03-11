import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { reviews, users, repairerProfiles } from '@/db/schema'
import { eq, sql, and, gte, count, avg } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'

export const GET = withAdmin('reviews', async (request, session) => {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const targetType = searchParams.get('targetType') || REVIEW_TARGET_TYPES.REPAIRER

    const days = parseInt(period)
    if (isNaN(days) || days < 1 || days > 365) {
      return apiBadRequest('Ungültiger Zeitraum (1-365 Tage)')
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))
    const startDateStr = startDate.toISOString()

    // Get overall review statistics
    const [overallStats] = await db
      .select({
        totalReviews: count(),
        publishedReviews: sql<number>`COUNT(CASE WHEN ${reviews.status} = ${REVIEW_STATUS.PUBLISHED} THEN 1 END)`,
        pendingReviews: sql<number>`COUNT(CASE WHEN ${reviews.status} = ${REVIEW_STATUS.PENDING_MODERATION} THEN 1 END)`,
        hiddenReviews: sql<number>`COUNT(CASE WHEN ${reviews.status} = ${REVIEW_STATUS.HIDDEN} THEN 1 END)`,
        averageRating: sql<number>`ROUND(AVG(${reviews.overallRating})::numeric, 2)`,
        verifiedReviews: sql<number>`COUNT(CASE WHEN ${reviews.isVerifiedPurchase} = true THEN 1 END)`,
      })
      .from(reviews)
      .where(and(
        eq(reviews.targetType, targetType),
        gte(reviews.createdAt, startDateStr)
      ))

    // Get rating distribution
    const ratingDistributionRows = await db
      .select({
        overallRating: reviews.overallRating,
        count: count(),
      })
      .from(reviews)
      .where(and(
        eq(reviews.targetType, targetType),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
        gte(reviews.createdAt, startDateStr)
      ))
      .groupBy(reviews.overallRating)
      .orderBy(sql`${reviews.overallRating} DESC`)

    // Get top-rated repairers
    const topRatedRows = await db
      .select({
        businessName: repairerProfiles.businessName,
        averageRating: repairerProfiles.averageRating,
        totalReviews: repairerProfiles.totalReviews,
        recentReviews: count(reviews.id),
      })
      .from(repairerProfiles)
      .leftJoin(reviews, and(
        eq(reviews.targetType, REVIEW_TARGET_TYPES.REPAIRER),
        eq(reviews.targetId, repairerProfiles.id),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
        gte(reviews.createdAt, startDateStr)
      ))
      .where(and(
        eq(repairerProfiles.isVerified, true),
        sql`${repairerProfiles.totalReviews} > 0`
      ))
      .groupBy(repairerProfiles.id, repairerProfiles.businessName, repairerProfiles.averageRating, repairerProfiles.totalReviews)
      .orderBy(sql`${repairerProfiles.averageRating} DESC, ${repairerProfiles.totalReviews} DESC`)
      .limit(10)

    // Get review trends (daily for the period)
    const trendRows = await db
      .select({
        date: sql<string>`DATE(${reviews.createdAt})`,
        count: count(),
        avgRating: sql<number>`ROUND(AVG(${reviews.overallRating})::numeric, 2)`,
      })
      .from(reviews)
      .where(and(
        eq(reviews.targetType, targetType),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
        gte(reviews.createdAt, startDateStr)
      ))
      .groupBy(sql`DATE(${reviews.createdAt})`)
      .orderBy(sql`DATE(${reviews.createdAt}) DESC`)

    // Get most active reviewers
    const activeReviewerRows = await db
      .select({
        name: users.name,
        reviewCount: count(reviews.id),
        avgRatingGiven: sql<number>`ROUND(AVG(${reviews.overallRating})::numeric, 2)`,
      })
      .from(users)
      .innerJoin(reviews, eq(users.id, reviews.reviewerId))
      .where(and(
        eq(reviews.targetType, targetType),
        eq(reviews.status, REVIEW_STATUS.PUBLISHED),
        gte(reviews.createdAt, startDateStr)
      ))
      .groupBy(users.id, users.name)
      .orderBy(sql`COUNT(${reviews.id}) DESC`)
      .limit(10)

    const totalReviews = Number(overallStats.totalReviews) || 0
    const publishedReviews = Number(overallStats.publishedReviews) || 0

    const analytics = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      overview: {
        totalReviews,
        publishedReviews,
        pendingReviews: Number(overallStats.pendingReviews) || 0,
        hiddenReviews: Number(overallStats.hiddenReviews) || 0,
        verifiedReviews: Number(overallStats.verifiedReviews) || 0,
        averageRating: Number(overallStats.averageRating) || 0,
        publishRate: totalReviews > 0
          ? Math.round((publishedReviews / totalReviews) * 100)
          : 0
      },
      ratingDistribution: ratingDistributionRows.reduce((acc: Record<number, number>, row) => {
        acc[row.overallRating] = Number(row.count)
        return acc
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>),
      topRated: topRatedRows.map(row => ({
        name: row.businessName,
        averageRating: Number(row.averageRating),
        totalReviews: Number(row.totalReviews),
        recentReviews: Number(row.recentReviews)
      })),
      trends: trendRows.map(row => ({
        date: row.date,
        count: Number(row.count),
        averageRating: Number(row.avgRating)
      })),
      activeReviewers: activeReviewerRows.map(row => ({
        name: row.name,
        reviewCount: Number(row.reviewCount),
        averageRatingGiven: Number(row.avgRatingGiven)
      }))
    }

    logger.info('Admin fetched review analytics', {
      adminId: session.user.id,
      period: days,
      targetType,
      totalReviews: analytics.overview.totalReviews
    })

    return apiSuccess(analytics)

  } catch (error) {
    logger.error('Error fetching review analytics', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
