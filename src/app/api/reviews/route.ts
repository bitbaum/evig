import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'
import { sendEmail } from '@/lib/email'
import { validateBody, validateQuery, CreateReviewSchema, GetReviewsQuerySchema } from '@/lib/schemas'

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

interface AttachmentRow {
  id: string
  original_filename: string
  file_path: string
  mime_type: string
  attachment_type: string
}

interface CountRow {
  total: string
}

interface IdRow {
  id: string
}

interface RepairerRow {
  business_name: string
  email: string
  repairer_name: string | null
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

    // Check if current user is admin for non-published reviews
    let isAdmin = false
    if (status !== 'published') {
      const session = await auth()
      if (!session?.user?.id) {
        return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
      }

      if (!session.user.isStaff) {
        return apiForbidden('Nur Administratoren haben Zugriff')
      }
      isAdmin = true
    }

    // Build sort clause
    const validSortFields = ['created_at', 'overall_rating', 'helpful_votes']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // Get reviews with user details, responses, and attachments (optimized - single query)
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
      isAdmin ? null : null, // voter_id for vote checking (will be handled differently)
      targetType,
      targetId,
      status,
      limit,
      offset,
      REVIEW_TARGET_TYPES.REPAIRER,
    ])

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM ${TABLE_NAMES.REVIEWS} WHERE target_type = $1 AND target_id = $2 AND status = $3`,
      [targetType, targetId, status]
    )

    // Attachments are now included in the main query via json_agg
    const reviews = (reviewsResult.rows as ReviewRow[]).map((review) => ({
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
        value: review.value_rating
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
        attachmentType: att.attachment_type
      })),
      response: review.response_id ? {
        id: review.response_id,
        content: review.response_content,
        createdAt: review.response_created_at,
        responderName: review.responder_name
      } : null,
      createdAt: review.created_at,
      updatedAt: review.updated_at
    }))

    logger.info('Fetched reviews', {
      targetType,
      targetId,
      status,
      count: reviews.length
    })

    const countData = countResult.rows[0] as CountRow
    return apiSuccess({
      reviews,
      total: parseInt(countData.total),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < parseInt(countData.total)
      },
      filters: {
        targetType,
        targetId,
        status,
        sortBy: sortField,
        sortOrder: sortDirection
      }
    })

  } catch (error) {
    logger.error('Error fetching reviews', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const validation = validateBody(CreateReviewSchema, body)
    if (!validation.success) return validation.error
    const {
      targetType,
      targetId,
      bookingId,
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      timelinessRating,
      valueRating,
      title,
      content
    } = validation.data

    // Check if user already reviewed this target
    const existingReview = await query(`
      SELECT id FROM ${TABLE_NAMES.REVIEWS}
      WHERE reviewer_id = $1 AND target_type = $2 AND target_id = $3
        AND ($4::uuid IS NULL OR booking_id = $4)
    `, [session.user.id, targetType, targetId, bookingId || null])

    if (existingReview.rows.length > 0) {
      return apiBadRequest('Sie haben bereits eine Bewertung für dieses Ziel abgegeben')
    }

    // Verify target exists
    let targetExists = false
    if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
      const result = await query(`SELECT id FROM ${TABLE_NAMES.REPAIRER_PROFILES} WHERE id = $1 AND is_verified = true`, [targetId])
      targetExists = result.rows.length > 0
    } else if (targetType === 'service') {
      // Add service validation when services table exists
      targetExists = true // Placeholder
    } else if (targetType === 'workshop') {
      const result = await query(`SELECT id FROM ${TABLE_NAMES.WORKSHOPS} WHERE id = $1`, [targetId])
      targetExists = result.rows.length > 0
    } else if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
      const result = await query(
        `SELECT id FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} WHERE id = $1 AND status = 'completed'`,
        [targetId]
      )
      targetExists = result.rows.length > 0
    }

    if (!targetExists) {
      return apiNotFound('Das Bewertungsziel wurde nicht gefunden')
    }

    // Check if booking exists and belongs to user (for verified purchase)
    let verifiedPurchase = false
    if (bookingId) {
      // This would need to be implemented based on your booking system
      // For now, we'll assume it's verified if bookingId is provided
      verifiedPurchase = true
    }

    // Insert review
    const reviewResult = await query(`
      INSERT INTO ${TABLE_NAMES.REVIEWS} (
        reviewer_id, target_type, target_id, booking_id,
        overall_rating, communication_rating, professionalism_rating,
        quality_rating, timeliness_rating, value_rating,
        title, content, is_verified_purchase, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'published'
      )
      RETURNING id
    `, [
      session.user.id,
      targetType,
      targetId,
      bookingId || null,
      overallRating,
      communicationRating || null,
      professionalismRating || null,
      qualityRating || null,
      timelinessRating || null,
      valueRating || null,
      title || null,
      content,
      verifiedPurchase
    ])

    const createdReview = reviewResult.rows[0] as IdRow
    const reviewId = createdReview.id

    // Update helper average_rating for IT-Hilfe reviews
    if (targetType === REVIEW_TARGET_TYPES.IT_HILFE) {
      try {
        // Find the helper via matched offer
        const helperResult = await query(`
          SELECT o.helper_id
          FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
          JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON r.matched_offer_id = o.id
          WHERE r.id = $1
        `, [targetId])

        if (helperResult.rows.length > 0) {
          const helperId = (helperResult.rows[0] as { helper_id: string }).helper_id

          // Recalculate average from all published IT-Hilfe reviews for this helper
          const avgResult = await query(`
            SELECT AVG(rev.overall_rating) as avg_rating
            FROM ${TABLE_NAMES.REVIEWS} rev
            JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} req ON rev.target_id = req.id
            JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} off ON req.matched_offer_id = off.id
            WHERE rev.target_type = $1
              AND rev.status = 'published'
              AND off.helper_id = $2
          `, [REVIEW_TARGET_TYPES.IT_HILFE, helperId])

          const avgRating = avgResult.rows[0] ? (avgResult.rows[0] as { avg_rating: string }).avg_rating : null
          if (avgRating) {
            await query(
              `UPDATE ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} SET average_rating = $1 WHERE user_id = $2`,
              [parseFloat(avgRating), helperId]
            )
          }
        }
      } catch (error) {
        logger.error('Error updating helper average rating', { error, targetId })
      }
    }

    // Send notification to repairer if it's a repairer review
    if (targetType === REVIEW_TARGET_TYPES.REPAIRER) {
      try {
        // Get repairer details
        const repairerResult = await query(`
          SELECT rp.business_name, u.email, u.name as repairer_name
          FROM ${TABLE_NAMES.REPAIRER_PROFILES} rp
          JOIN ${TABLE_NAMES.USERS} u ON rp.user_id = u.id
          WHERE rp.id = $1
        `, [targetId])

        if (repairerResult.rows.length > 0) {
          const repairer = repairerResult.rows[0] as RepairerRow
          const reviewUrl = `${APP_URL}/dashboard/repairer/reviews`

          const notificationResult = await sendEmail(
            repairer.email,
            'newReviewNotification',
            repairer.repairer_name || repairer.business_name || 'Reparateur',
            session.user.name || 'Kunde',
            overallRating,
            content,
            reviewUrl
          )

          if (!notificationResult.success) {
            logger.warn('Failed to send new review notification', {
              reviewId,
              repairerEmail: repairer.email,
              error: notificationResult.error
            })
          }
        }
      } catch (error) {
        logger.error('Error sending review notification', { error, reviewId })
      }
    }

    logger.info('Review created', {
      reviewId,
      reviewerId: session.user.id,
      targetType,
      targetId,
      overallRating
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich erstellt',
      reviewId
    }, 201)

  } catch (error) {
    logger.error('Error creating review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}