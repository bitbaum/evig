import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, validateQuery, CreateReviewSchema, GetReviewsQuerySchema } from '@/lib/schemas'
import {
  validateReviewTarget,
  updateHelperAverageRating,
  notifyRepairerOfReview,
} from '@/lib/reviews/review-service'

interface ReviewAttachment {
  id: string
  original_filename: string
  file_path: string
  mime_type: string
  attachment_type: string
}

interface ReviewRow {
  id: string
  reviewer_id: string
  reviewer_name: string
  reviewer_email: string
  target_type: string
  target_id: string
  target_name: string
  booking_id: string | null
  overall_rating: number
  communication_rating: number | null
  professionalism_rating: number | null
  quality_rating: number | null
  timeliness_rating: number | null
  value_rating: number | null
  title: string | null
  content: string
  is_verified_purchase: boolean
  helpful_votes: number
  total_votes: number
  user_has_voted: boolean
  user_vote: string | null
  status: string
  response_id: string | null
  response_content: string | null
  response_created_at: string | null
  responder_name: string | null
  created_at: string
  updated_at: string
  attachments: ReviewAttachment[] | null
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryValidation = validateQuery(GetReviewsQuerySchema, {
      targetType: searchParams.get('targetType'),
      targetId: searchParams.get('targetId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    })
    if (!queryValidation.success) return queryValidation.error
    const { targetType, targetId, status, limit, offset, sortBy, sortOrder } = queryValidation.data

    // Non-published reviews require admin
    let isAdmin = false
    if (status !== 'published') {
      const session = await auth()
      if (!session?.user?.id) return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
      if (!session.user.isStaff) return apiForbidden('Nur Administratoren haben Zugriff')
      isAdmin = true
    }

    // Build sort clause
    const validSortFields = ['created_at', 'overall_rating', 'helpful_votes']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    const reviewsResult = await query(`
      SELECT
        r.*,
        u.name as reviewer_name,
        u.email as reviewer_email,
        COALESCE(rp.business_name, '') as target_name,
        rr.id as response_id,
        rr.content as response_content,
        rr.created_at as response_created_at,
        ru.name as responder_name,
        CASE WHEN rv.vote_type IS NOT NULL THEN true ELSE false END as user_has_voted,
        rv.vote_type as user_vote,
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id', ra.id,
              'original_filename', ra.original_filename,
              'file_path', ra.file_path,
              'mime_type', ra.mime_type,
              'attachment_type', ra.attachment_type
            ) ORDER BY ra.sort_order, ra.created_at
          ), '[]'::json)
          FROM ${TABLE_NAMES.REVIEW_ATTACHMENTS} ra
          WHERE ra.review_id = r.id
        ) as attachments
      FROM ${TABLE_NAMES.REVIEWS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.reviewer_id = u.id
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = $7 AND r.target_id = rp.id
      LEFT JOIN ${TABLE_NAMES.REVIEW_RESPONSES} rr ON r.id = rr.review_id AND rr.status = 'published'
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON rr.responder_id = ru.id
      LEFT JOIN ${TABLE_NAMES.REVIEW_VOTES} rv ON r.id = rv.review_id AND rv.voter_id = $1
      WHERE r.target_type = $2 AND r.target_id = $3 AND r.status = $4
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $5 OFFSET $6
    `, [
      isAdmin ? null : null,
      targetType,
      targetId,
      status,
      limit,
      offset,
      REVIEW_TARGET_TYPES.REPAIRER,
    ])

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) as total FROM ${TABLE_NAMES.REVIEWS} WHERE target_type = $1 AND target_id = $2 AND status = $3`,
      [targetType, targetId, status]
    )

    const reviews = (reviewsResult.rows as ReviewRow[]).map(mapReviewRow)
    const total = parseInt(countResult.rows[0].total)

    logger.info('Fetched reviews', { targetType, targetId, status, count: reviews.length })

    return apiSuccess({
      reviews,
      total,
      pagination: { limit, offset, hasMore: offset + limit < total },
      filters: { targetType, targetId, status, sortBy: sortField, sortOrder: sortDirection },
    })
  } catch (error) {
    logger.error('Error fetching reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)

    const body = await request.json()
    const validation = validateBody(CreateReviewSchema, body)
    if (!validation.success) return validation.error

    const {
      targetType, targetId, bookingId, overallRating,
      communicationRating, professionalismRating, qualityRating,
      timelinessRating, valueRating, title, content,
    } = validation.data

    // Duplicate check
    const existingReview = await query(
      `SELECT id FROM ${TABLE_NAMES.REVIEWS}
       WHERE reviewer_id = $1 AND target_type = $2 AND target_id = $3
         AND ($4::uuid IS NULL OR booking_id = $4)`,
      [session.user.id, targetType, targetId, bookingId || null]
    )

    if (existingReview.rows.length > 0) {
      return apiBadRequest('Sie haben bereits eine Bewertung für dieses Ziel abgegeben')
    }

    // Verify target exists
    if (!await validateReviewTarget(targetType, targetId)) {
      return apiNotFound('Das Bewertungsziel wurde nicht gefunden')
    }

    const verifiedPurchase = !!bookingId

    // Insert review
    const reviewResult = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.REVIEWS} (
        reviewer_id, target_type, target_id, booking_id,
        overall_rating, communication_rating, professionalism_rating,
        quality_rating, timeliness_rating, value_rating,
        title, content, is_verified_purchase, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published')
      RETURNING id`,
      [
        session.user.id, targetType, targetId, bookingId || null,
        overallRating,
        communicationRating || null, professionalismRating || null,
        qualityRating || null, timelinessRating || null, valueRating || null,
        title || null, content, verifiedPurchase,
      ]
    )

    const reviewId = reviewResult.rows[0].id

    // Post-creation side-effects
    if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
      await updateHelperAverageRating(targetId)
    }

    if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
      await notifyRepairerOfReview(
        targetId,
        reviewId,
        session.user.name || 'Kunde',
        overallRating,
        content
      )
    }

    logger.info('Review created', {
      reviewId, reviewerId: session.user.id, targetType, targetId, overallRating,
    })

    return apiSuccess({ message: 'Bewertung erfolgreich erstellt', reviewId }, 201)
  } catch (error) {
    logger.error('Error creating review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function mapReviewRow(review: ReviewRow) {
  return {
    id: review.id,
    reviewerId: review.reviewer_id,
    reviewerName: review.reviewer_name,
    reviewerEmail: review.reviewer_email,
    targetType: review.target_type,
    targetId: review.target_id,
    targetName: review.target_name,
    bookingId: review.booking_id,
    overallRating: review.overall_rating,
    ratings: {
      communication: review.communication_rating,
      professionalism: review.professionalism_rating,
      quality: review.quality_rating,
      timeliness: review.timeliness_rating,
      value: review.value_rating,
    },
    title: review.title,
    content: review.content,
    isVerifiedPurchase: review.is_verified_purchase,
    helpfulVotes: review.helpful_votes,
    totalVotes: review.total_votes,
    userHasVoted: review.user_has_voted,
    userVote: review.user_vote,
    status: review.status,
    attachments: (review.attachments || []).map((att: ReviewAttachment) => ({
      id: att.id,
      filename: att.original_filename,
      filePath: att.file_path,
      mimeType: att.mime_type,
      attachmentType: att.attachment_type,
    })),
    response: review.response_id ? {
      id: review.response_id,
      content: review.response_content,
      createdAt: review.response_created_at,
      responderName: review.responder_name,
    } : null,
    createdAt: review.created_at,
    updatedAt: review.updated_at,
  }
}
