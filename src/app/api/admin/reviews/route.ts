/**
 * Reviews List API
 *
 * GET /api/admin/reviews
 * Lists all reviews with optional filtering by status
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query, paginatedQuery } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface ReviewRow {
  id: string
  reviewer_id: string
  reviewer_name: string
  reviewer_email: string
  target_type: string
  target_id: string
  target_name: string
  overall_rating: number
  title: string | null
  content: string
  status: string
  helpful_votes: number
  total_votes: number
  is_verified_purchase: boolean
  moderation_reason: string | null
  moderated_by: string | null
  moderated_at: string | null
  created_at: string
  updated_at: string
  response_content: string | null
  response_responder_name: string | null
  response_created_at: string | null
}

export const GET = withAdmin(async (request, session) => {
  try {
    // Parse query params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending_moderation'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Check if reviews table exists
    const tableCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = $1
      ) as exists
    `, [TABLE_NAMES.REVIEWS])

    if (!tableCheck.rows[0] || !tableCheck.rows[0].exists) {
      // Return empty array if table doesn't exist yet
      logger.info('Reviews table does not exist yet')
      return apiSuccess({ reviews: [], total: 0 })
    }

    // Fetch reviews with optional response data
    const { rows: reviewRows, total } = await paginatedQuery<ReviewRow>(`
      SELECT
        r.id,
        r.reviewer_id,
        COALESCE(u.name, 'Unbekannt') as reviewer_name,
        COALESCE(u.email, '') as reviewer_email,
        r.target_type,
        r.target_id,
        COALESCE(r.target_name, 'Unbekannt') as target_name,
        r.overall_rating,
        r.title,
        r.content,
        r.status,
        COALESCE(r.helpful_votes, 0) as helpful_votes,
        COALESCE(r.total_votes, 0) as total_votes,
        COALESCE(r.is_verified_purchase, false) as is_verified_purchase,
        r.moderation_reason,
        r.moderated_by,
        r.moderated_at,
        r.created_at,
        r.updated_at,
        rr.content as response_content,
        ru.name as response_responder_name,
        rr.created_at as response_created_at
      FROM ${TABLE_NAMES.REVIEWS} r
      LEFT JOIN ${TABLE_NAMES.USERS} u ON u.id = r.reviewer_id
      LEFT JOIN ${TABLE_NAMES.REVIEW_RESPONSES} rr ON rr.review_id = r.id
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON ru.id = rr.responder_id
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `, [status, limit, offset])

    // Transform to camelCase for frontend
    const reviews = reviewRows.map(row => ({
      id: row.id,
      reviewerId: row.reviewer_id,
      reviewerName: row.reviewer_name,
      reviewerEmail: row.reviewer_email,
      targetType: row.target_type,
      targetId: row.target_id,
      targetName: row.target_name,
      overallRating: row.overall_rating,
      title: row.title,
      content: row.content,
      status: row.status,
      helpfulVotes: row.helpful_votes,
      totalVotes: row.total_votes,
      isVerifiedPurchase: row.is_verified_purchase,
      moderationReason: row.moderation_reason,
      moderatedBy: row.moderated_by,
      moderatedAt: row.moderated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      response: row.response_content ? {
        content: row.response_content,
        responderName: row.response_responder_name,
        createdAt: row.response_created_at
      } : undefined
    }))

    logger.info('Reviews fetched', {
      userId: session.user.id,
      status,
      count: reviews.length,
      total
    })

    return apiSuccess({ reviews, total })

  } catch (error) {
    logger.error('Error fetching reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
