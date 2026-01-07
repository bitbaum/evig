import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Check if user is admin using SSOT helper
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    if (!userResult.rows[0] || !isAdminRole(userResult.rows[0].role)) {
      return apiUnauthorized('Nur Administratoren können Analytics einsehen')
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const targetType = searchParams.get('targetType') || 'repairer'

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
      FROM reviews
      WHERE target_type = $1 AND created_at >= $2
    `, [targetType, startDate.toISOString()])

    // Get rating distribution
    const ratingDistribution = await query(`
      SELECT
        overall_rating,
        COUNT(*) as count
      FROM reviews
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
      FROM repairer_profiles rp
      LEFT JOIN reviews r ON r.target_type = 'repairer' AND r.target_id = rp.id
        AND r.status = 'published' AND r.created_at >= $1
      WHERE rp.is_verified = true AND rp.total_reviews > 0
      GROUP BY rp.id, rp.business_name, rp.average_rating, rp.total_reviews
      ORDER BY rp.average_rating DESC, rp.total_reviews DESC
      LIMIT 10
    `, [startDate.toISOString()])

    // Get review trends (daily for the period)
    const reviewTrends = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(overall_rating)::numeric, 2) as avg_rating
      FROM reviews
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
      FROM users u
      JOIN reviews r ON u.id = r.reviewer_id
      WHERE r.target_type = $1 AND r.status = 'published' AND r.created_at >= $2
      GROUP BY u.id, u.name
      ORDER BY review_count DESC
      LIMIT 10
    `, [targetType, startDate.toISOString()])

    const analytics = {
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      overview: {
        totalReviews: parseInt(overallStats.rows[0].total_reviews),
        publishedReviews: parseInt(overallStats.rows[0].published_reviews),
        pendingReviews: parseInt(overallStats.rows[0].pending_reviews),
        hiddenReviews: parseInt(overallStats.rows[0].hidden_reviews),
        verifiedReviews: parseInt(overallStats.rows[0].verified_reviews),
        averageRating: parseFloat(overallStats.rows[0].average_rating) || 0,
        publishRate: overallStats.rows[0].total_reviews > 0
          ? Math.round((overallStats.rows[0].published_reviews / overallStats.rows[0].total_reviews) * 100)
          : 0
      },
      ratingDistribution: ratingDistribution.rows.reduce((acc: any, row) => {
        acc[row.overall_rating] = parseInt(row.count)
        return acc
      }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
      topRated: topRated.rows.map(row => ({
        name: row.business_name,
        averageRating: parseFloat(row.average_rating),
        totalReviews: parseInt(row.total_reviews),
        recentReviews: parseInt(row.recent_reviews)
      })),
      trends: reviewTrends.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
        averageRating: parseFloat(row.avg_rating)
      })),
      activeReviewers: activeReviewers.rows.map(row => ({
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
}