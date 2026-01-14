import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface ReviewRow {
  id: string
  target_type: string
  target_id: string
  target_name: string
  overall_rating: number
  communication_rating: number | null
  professionalism_rating: number | null
  quality_rating: number | null
  timeliness_rating: number | null
  value_rating: number | null
  title: string | null
  content: string
  status: string
  helpful_votes: number
  total_votes: number
  is_verified_purchase: boolean
  created_at: string
  updated_at: string
  response_id: string | null
  response_content: string | null
  response_created_at: string | null
  responder_name: string | null
}

interface CountRow {
  total: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    let whereClause = 'r.reviewer_id = $1'
    const params: (string | number)[] = [session.user.id]

    if (status !== 'all') {
      whereClause += ` AND r.status = $${params.length + 1}`
      params.push(status)
    }

    // Get user's reviews with responses
    const reviewsResult = await query(`
      SELECT
        r.*,
        COALESCE(rp.business_name, ws.title, 'Unbekannt') as target_name,
        rr.id as response_id,
        rr.content as response_content,
        rr.created_at as response_created_at,
        ru.name as responder_name
      FROM ${TABLE_NAMES.REVIEWS} r
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      LEFT JOIN ${TABLE_NAMES.WORKSHOPS} ws ON r.target_type = 'workshop' AND r.target_id = ws.id::text
      LEFT JOIN ${TABLE_NAMES.REVIEW_RESPONSES} rr ON r.id = rr.review_id AND rr.status = 'published'
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON rr.responder_id = ru.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset])

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAMES.REVIEWS} r WHERE ${whereClause}`,
      params
    )

    const reviews = (reviewsResult.rows as ReviewRow[]).map(review => ({
      id: review.id,
      targetType: review.target_type,
      targetId: review.target_id,
      targetName: review.target_name,
      overallRating: review.overall_rating,
      ratings: {
        communication: review.communication_rating,
        professionalism: review.professionalism_rating,
        quality: review.quality_rating,
        timeliness: review.timeliness_rating,
        value: review.value_rating
      },
      title: review.title,
      content: review.content,
      status: review.status,
      helpfulVotes: review.helpful_votes,
      totalVotes: review.total_votes,
      isVerifiedPurchase: review.is_verified_purchase,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
      response: review.response_id ? {
        id: review.response_id,
        content: review.response_content,
        responderName: review.responder_name,
        createdAt: review.response_created_at
      } : null
    }))

    logger.info('Fetched user reviews', {
      userId: session.user.id,
      count: reviews.length,
      status
    })

    const countData = countResult.rows[0] as CountRow
    return apiSuccess({
      reviews,
      total: parseInt(countData.total),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < parseInt(countData.total)
      }
    })

  } catch (error) {
    logger.error('Error fetching user reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}