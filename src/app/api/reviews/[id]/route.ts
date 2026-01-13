import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    // Get review with full details
    const reviewResult = await query(`
      SELECT
        r.*,
        u.name as reviewer_name,
        u.email as reviewer_email,
        COALESCE(rp.business_name, '') as target_name,
        rr.id as response_id,
        rr.content as response_content,
        rr.created_at as response_created_at,
        ru.name as responder_name
      FROM ${TABLE_NAMES.REVIEWS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.reviewer_id = u.id
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      LEFT JOIN ${TABLE_NAMES.REVIEW_RESPONSES} rr ON r.id = rr.review_id AND rr.status = 'published'
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON rr.responder_id = ru.id
      WHERE r.id = $1
    `, [reviewId])

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0]

    // Get attachments
    const attachmentsResult = await query(
      `SELECT * FROM ${TABLE_NAMES.REVIEW_ATTACHMENTS} WHERE review_id = $1 ORDER BY sort_order, created_at`,
      [reviewId]
    )

    const reviewData = {
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
      status: review.status,
      moderationReason: review.moderation_reason,
      moderatedBy: review.moderated_by,
      moderatedAt: review.moderated_at,
      attachments: attachmentsResult.rows.map(att => ({
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
    }

    return apiSuccess({ review: reviewData })

  } catch (error) {
    logger.error('Error fetching review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const {
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      timelinessRating,
      valueRating,
      title,
      content
    } = body

    // Get review and check ownership
    const reviewResult = await query(
      `SELECT * FROM ${TABLE_NAMES.REVIEWS} WHERE id = $1`,
      [reviewId]
    )

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0]

    // Check if user owns this review
    if (review.reviewer_id !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Bewertungen bearbeiten')
    }

    // Check if review can still be edited (within time limit, e.g., 30 days)
    const createdAt = new Date(review.created_at)
    const now = new Date()
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceCreation > 30) {
      return apiBadRequest('Bewertungen können nur innerhalb von 30 Tagen bearbeitet werden')
    }

    // Validate ratings
    if (overallRating && (overallRating < 1 || overallRating > 5)) {
      return apiBadRequest('Gesamtbewertung muss zwischen 1 und 5 liegen')
    }

    const ratingFields = [communicationRating, professionalismRating, qualityRating, timelinessRating, valueRating]
    for (const rating of ratingFields) {
      if (rating !== undefined && rating !== null && (rating < 1 || rating > 5)) {
        return apiBadRequest('Einzelbewertungen müssen zwischen 1 und 5 liegen')
      }
    }

    // Update review
    await query(`
      UPDATE ${TABLE_NAMES.REVIEWS} SET
        overall_rating = COALESCE($1, overall_rating),
        communication_rating = COALESCE($2, communication_rating),
        professionalism_rating = COALESCE($3, professionalism_rating),
        quality_rating = COALESCE($4, quality_rating),
        timeliness_rating = COALESCE($5, timeliness_rating),
        value_rating = COALESCE($6, value_rating),
        title = COALESCE($7, title),
        content = COALESCE($8, content),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
    `, [
      overallRating,
      communicationRating,
      professionalismRating,
      qualityRating,
      timelinessRating,
      valueRating,
      title,
      content,
      reviewId
    ])

    logger.info('Review updated', {
      reviewId,
      reviewerId: session.user.id
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich aktualisiert',
      reviewId
    })

  } catch (error) {
    logger.error('Error updating review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reviewId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // Get review and check ownership
    const reviewResult = await query(
      `SELECT reviewer_id FROM ${TABLE_NAMES.REVIEWS} WHERE id = $1`,
      [reviewId]
    )

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0]

    // Check if user owns this review or is admin
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    const isAdmin = isAdminRole(userResult.rows[0]?.role)
    const isOwner = review.reviewer_id === session.user.id

    if (!isOwner && !isAdmin) {
      return apiForbidden('Sie können nur Ihre eigenen Bewertungen löschen')
    }

    // Soft delete by setting status to 'deleted'
    await query(`
      UPDATE ${TABLE_NAMES.REVIEWS} SET
        status = 'deleted',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [reviewId])

    // Log moderation action if admin
    if (isAdmin && !isOwner) {
      await query(`
        INSERT INTO ${TABLE_NAMES.REVIEW_MODERATION_LOG} (
          review_id, action, reason, admin_id, old_status, new_status
        ) VALUES ($1, 'delete', 'User requested deletion', $2, 'published', 'deleted')
      `, [reviewId, session.user.id])
    }

    logger.info('Review deleted', {
      reviewId,
      deletedBy: session.user.id,
      isAdmin
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich gelöscht',
      reviewId
    })

  } catch (error) {
    logger.error('Error deleting review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
