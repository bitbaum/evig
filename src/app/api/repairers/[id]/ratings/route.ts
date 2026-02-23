import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'

interface ProfileRow {
  id: string
  business_name: string
  average_rating: string
  total_reviews: string
  rating_distribution: Record<string, number> | null
  review_summary: {
    communication?: string
    professionalism?: string
    quality?: string
    timeliness?: string
    value?: string
  } | null
}

interface RatingBreakdownRow {
  overall_rating: number
  count: string
}

interface ReviewRow {
  id: string
  overall_rating: number
  title: string
  content: string
  created_at: string
  is_verified_purchase: boolean
  reviewer_name: string
  response_content: string | null
  response_created_at: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: repairerId } = await params

  try {

    // Get repairer profile with rating summary
    const profileResult = await query(`
      SELECT
        id,
        business_name,
        average_rating,
        total_reviews,
        rating_distribution,
        review_summary
      FROM ${TABLE_NAMES.REPAIRER_PROFILES}
      WHERE id = $1 AND is_verified = true
    `, [repairerId])

    if (profileResult.rows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const profile = profileResult.rows[0] as ProfileRow

    // Get recent reviews (last 10)
    const reviewsResult = await query(`
      SELECT
        r.id,
        r.overall_rating,
        r.title,
        r.content,
        r.created_at,
        r.is_verified_purchase,
        u.name as reviewer_name,
        rr.content as response_content,
        rr.created_at as response_created_at
      FROM ${TABLE_NAMES.REVIEWS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.reviewer_id = u.id
      LEFT JOIN ${TABLE_NAMES.REVIEW_RESPONSES} rr ON r.id = rr.review_id AND rr.status = 'published'
      WHERE r.target_type = '${REVIEW_TARGET_TYPES.REPAIRER}'
        AND r.target_id = $1
        AND r.status = 'published'
      ORDER BY r.created_at DESC
      LIMIT 10
    `, [repairerId])

    // Get rating breakdown
    const ratingBreakdown = await query(`
      SELECT
        overall_rating,
        COUNT(*) as count
      FROM ${TABLE_NAMES.REVIEWS}
      WHERE target_type = '${REVIEW_TARGET_TYPES.REPAIRER}'
        AND target_id = $1
        AND status = 'published'
      GROUP BY overall_rating
      ORDER BY overall_rating DESC
    `, [repairerId])

    const breakdownMap = (ratingBreakdown.rows as RatingBreakdownRow[]).reduce((acc: Record<number, number>, row) => {
      acc[row.overall_rating] = parseInt(row.count)
      return acc
    }, {} as Record<number, number>)

    const ratings = {
      overview: {
        averageRating: parseFloat(profile.average_rating) || 0,
        totalReviews: parseInt(profile.total_reviews) || 0,
        ratingDistribution: profile.rating_distribution || { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 }
      },
      breakdown: {
        5: breakdownMap[5] || 0,
        4: breakdownMap[4] || 0,
        3: breakdownMap[3] || 0,
        2: breakdownMap[2] || 0,
        1: breakdownMap[1] || 0
      },
      detailedRatings: profile.review_summary ? {
        communication: parseFloat(profile.review_summary.communication || '0') || 0,
        professionalism: parseFloat(profile.review_summary.professionalism || '0') || 0,
        quality: parseFloat(profile.review_summary.quality || '0') || 0,
        timeliness: parseFloat(profile.review_summary.timeliness || '0') || 0,
        value: parseFloat(profile.review_summary.value || '0') || 0
      } : {
        communication: 0,
        professionalism: 0,
        quality: 0,
        timeliness: 0,
        value: 0
      },
      recentReviews: (reviewsResult.rows as ReviewRow[]).map(review => ({
        id: review.id,
        rating: review.overall_rating,
        title: review.title,
        content: review.content,
        reviewerName: review.reviewer_name,
        isVerifiedPurchase: review.is_verified_purchase,
        createdAt: review.created_at,
        response: review.response_content ? {
          content: review.response_content,
          createdAt: review.response_created_at
        } : null
      }))
    }

    logger.info('Fetched repairer ratings', {
      repairerId,
      totalReviews: ratings.overview.totalReviews
    })

    return apiSuccess({
      repairer: {
        id: profile.id,
        businessName: profile.business_name
      },
      ratings
    })

  } catch (error) {
    logger.error('Error fetching repairer ratings', { error, repairerId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}