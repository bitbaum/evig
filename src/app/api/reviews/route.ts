import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { APP_URL } from '@/config/urls'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')
    const status = searchParams.get('status') || 'published'
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Validate required parameters
    if (!targetType || !targetId) {
      return apiBadRequest('targetType und targetId sind erforderlich')
    }

    if (!['repairer', 'service', 'workshop'].includes(targetType)) {
      return apiBadRequest('Ungültiger targetType')
    }

    if (!['published', 'pending_moderation', 'hidden', 'deleted'].includes(status)) {
      return apiBadRequest('Ungültiger Status-Filter')
    }

    // Check if current user is admin for non-published reviews
    let isAdmin = false
    if (status !== 'published') {
      const session = await auth()
      if (!session?.user?.id) {
        return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
      }

      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [session.user.id]
      )

      if (userResult.rows[0]?.role !== 'admin') {
        return apiUnauthorized('Nur Administratoren können nicht-veröffentlichte Bewertungen einsehen')
      }
      isAdmin = true
    }

    // Build sort clause
    const validSortFields = ['created_at', 'overall_rating', 'helpful_votes']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC'

    // Get reviews with user details and responses
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
        rv.vote_type as user_vote
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      LEFT JOIN repairer_profiles rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      LEFT JOIN review_responses rr ON r.id = rr.review_id AND rr.status = 'published'
      LEFT JOIN users ru ON rr.responder_id = ru.id
      LEFT JOIN review_votes rv ON r.id = rv.review_id AND rv.voter_id = $1
      WHERE r.target_type = $2 AND r.target_id = $3 AND r.status = $4
      ORDER BY r.${sortField} ${sortDirection}
      LIMIT $5 OFFSET $6
    `, [
      isAdmin ? null : null, // voter_id for vote checking (will be handled differently)
      targetType,
      targetId,
      status,
      limit,
      offset
    ])

    // Get total count for pagination
    const countResult = await query(
      'SELECT COUNT(*) as total FROM reviews WHERE target_type = $1 AND target_id = $2 AND status = $3',
      [targetType, targetId, status]
    )

    // Get attachments for each review
    const reviewsWithAttachments = await Promise.all(
      reviewsResult.rows.map(async (review) => {
        const attachmentsResult = await query(
          'SELECT * FROM review_attachments WHERE review_id = $1 ORDER BY sort_order, created_at',
          [review.id]
        )

        return {
          ...review,
          attachments: attachmentsResult.rows.map(att => ({
            id: att.id,
            filename: att.original_filename,
            filePath: att.file_path,
            mimeType: att.mime_type,
            attachmentType: att.attachment_type
          }))
        }
      })
    )

    const reviews = reviewsWithAttachments.map(review => ({
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
      attachments: review.attachments,
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

    return apiSuccess({
      reviews,
      total: parseInt(countResult.rows[0].total),
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < parseInt(countResult.rows[0].total)
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
      content,
      isVerifiedPurchase = false
    } = body

    // Validate required fields
    if (!targetType || !targetId || !content || !overallRating) {
      return apiBadRequest('targetType, targetId, content und overallRating sind erforderlich')
    }

    if (!['repairer', 'service', 'workshop'].includes(targetType)) {
      return apiBadRequest('Ungültiger targetType')
    }

    if (overallRating < 1 || overallRating > 5) {
      return apiBadRequest('Gesamtbewertung muss zwischen 1 und 5 liegen')
    }

    // Validate rating fields if provided
    const ratingFields = [communicationRating, professionalismRating, qualityRating, timelinessRating, valueRating]
    for (const rating of ratingFields) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        return apiBadRequest('Einzelbewertungen müssen zwischen 1 und 5 liegen')
      }
    }

    // Check if user already reviewed this target
    const existingReview = await query(`
      SELECT id FROM reviews
      WHERE reviewer_id = $1 AND target_type = $2 AND target_id = $3
        AND ($4::uuid IS NULL OR booking_id = $4)
    `, [session.user.id, targetType, targetId, bookingId || null])

    if (existingReview.rows.length > 0) {
      return apiBadRequest('Sie haben bereits eine Bewertung für dieses Ziel abgegeben')
    }

    // Verify target exists
    let targetExists = false
    if (targetType === 'repairer') {
      const result = await query('SELECT id FROM repairer_profiles WHERE id = $1 AND is_verified = true', [targetId])
      targetExists = result.rows.length > 0
    } else if (targetType === 'service') {
      // Add service validation when services table exists
      targetExists = true // Placeholder
    } else if (targetType === 'workshop') {
      const result = await query('SELECT id FROM workshops WHERE id = $1', [targetId])
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
      INSERT INTO reviews (
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

    const reviewId = reviewResult.rows[0].id

    // Send notification to repairer if it's a repairer review
    if (targetType === 'repairer') {
      try {
        // Get repairer details
        const repairerResult = await query(`
          SELECT rp.business_name, u.email, u.name as repairer_name
          FROM repairer_profiles rp
          JOIN users u ON rp.user_id = u.id
          WHERE rp.id = $1
        `, [targetId])

        if (repairerResult.rows.length > 0) {
          const repairer = repairerResult.rows[0]
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
      message: SUCCESS_MESSAGES.REVIEW_CREATED,
      reviewId
    }, 201)

  } catch (error) {
    logger.error('Error creating review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}