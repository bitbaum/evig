import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'

interface OverallStatsRow {
  total_reviews: string
  published_reviews: string
  pending_reviews: string
  hidden_reviews: string
  average_rating: string
  verified_reviews: string
}

interface RatingDistributionRow {
  overall_rating: number
  count: string
}

interface TopRatedRow {
  business_name: string
  average_rating: string
  total_reviews: string
  recent_reviews: string
}

interface TrendRow {
  date: string
  count: string
  avg_rating: string
}

interface ReviewerRow {
  name: string
  review_count: string
  avg_rating_given: string
}

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

    // Get overall review statistics
    const overallStats = await query(`
      SELECT
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_reviews,
        COUNT(CASE WHEN status = 'pending_moderation' THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN status = 'hidden' THEN 1 END) as hidden_reviews,
        ROUND(AVG(overall_rating)::numeric, 2) as average_rating,
        COUNT(CASE WHEN is_verified_purchase = true THEN 1 END) as verified_reviews
      FROM ${TABLE_NAMES.REVIEWS}
      WHERE target_type = $1 AND created_at >= $2
    `, [targetType, startDate.toISOString()])

    // Get rating distribution
    const ratingDistribution = await query(`
      SELECT
        overall_rating,
        COUNT(*) as count
      FROM ${TABLE_NAMES.REVIEWS}
      WHERE target_type = $1 AND status = 'published' AND created_at >= $2
      GROUP BY overall_rating
      ORDER BY overall_rating DESC
    `, [targetType, startDate.toISOString()])

    // Get top-rated repairers
    const topRated = await query(`
      SELECT
        rp.business_name,
        rp.average_rating,
        rp.total_reviews,
        COUNT(r.id) as recent_reviews
      FROM ${TABLE_NAMES.REPAIRER_PROFILES} rp
      LEFT JOIN ${TABLE_NAMES.REVIEWS} r ON r.target_type = $1 AND r.target_id = rp.id
        AND r.status = 'published' AND r.created_at >= $2
      WHERE rp.is_verified = true AND rp.total_reviews > 0
      GROUP BY rp.id, rp.business_name, rp.average_rating, rp.total_reviews
      ORDER BY rp.average_rating DESC, rp.total_reviews DESC
      LIMIT 10
    `, [REVIEW_TARGET_TYPES.REPAIRER, startDate.toISOString()])

    // Get review trends (daily for the period)
    const reviewTrends = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(overall_rating)::numeric, 2) as avg_rating
      FROM ${TABLE_NAMES.REVIEWS}
      WHERE target_type = $1 AND status = 'published' AND created_at >= $2
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC
    `, [targetType, startDate.toISOString()])

    // Get most active reviewers
    const activeReviewers = await query(`
      SELECT
        u.name,
        COUNT(r.id) as review_count,
        ROUND(AVG(r.overall_rating)::numeric, 2) as avg_rating_given
      FROM ${TABLE_NAMES.USERS} u
      JOIN ${TABLE_NAMES.REVIEWS} r ON u.id = r.reviewer_id
      WHERE r.target_type = $1 AND r.status = 'published' AND r.created_at >= $2
      GROUP BY u.id, u.name
      ORDER BY review_count DESC
      LIMIT 10
    `, [targetType, startDate.toISOString()])

    const stats = overallStats.rows[0] as OverallStatsRow
    const totalReviews = parseInt(stats.total_reviews)
    const publishedReviews = parseInt(stats.published_reviews)

    const analytics = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      overview: {
        totalReviews,
        publishedReviews,
        pendingReviews: parseInt(stats.pending_reviews),
        hiddenReviews: parseInt(stats.hidden_reviews),
        verifiedReviews: parseInt(stats.verified_reviews),
        averageRating: parseFloat(stats.average_rating) || 0,
        publishRate: totalReviews > 0
          ? Math.round((publishedReviews / totalReviews) * 100)
          : 0
      },
      ratingDistribution: (ratingDistribution.rows as RatingDistributionRow[]).reduce((acc: Record<number, number>, row) => {
        acc[row.overall_rating] = parseInt(row.count)
        return acc
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>),
      topRated: (topRated.rows as TopRatedRow[]).map(row => ({
        name: row.business_name,
        averageRating: parseFloat(row.average_rating),
        totalReviews: parseInt(row.total_reviews),
        recentReviews: parseInt(row.recent_reviews)
      })),
      trends: (reviewTrends.rows as TrendRow[]).map(row => ({
        date: row.date,
        count: parseInt(row.count),
        averageRating: parseFloat(row.avg_rating)
      })),
      activeReviewers: (activeReviewers.rows as ReviewerRow[]).map(row => ({
        name: row.name,
        reviewCount: parseInt(row.review_count),
        averageRatingGiven: parseFloat(row.avg_rating_given)
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