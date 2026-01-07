import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const reviewId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiBadRequest('Antwort-Text ist erforderlich')
    }

    if (content.length > 2000) {
      return apiBadRequest('Antwort darf maximal 2000 Zeichen lang sein')
    }

    // Get review and check if user can respond
    const reviewResult = await query(`
      SELECT r.*, rp.user_id as repairer_user_id
      FROM reviews r
      LEFT JOIN repairer_profiles rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE r.id = $1
    `, [reviewId])

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0]

    // Check if user is the repairer being reviewed
    if (review.target_type === 'repairer' && review.repairer_user_id !== session.user.id) {
      return apiForbidden('Nur der bewertete Reparateur kann auf Bewertungen antworten')
    }

    // Check if user is admin (admins can respond on behalf of repairers)
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    const isAdmin = isAdminRole(userResult.rows[0]?.role)

    if (review.target_type !== 'repairer' && !isAdmin) {
      return apiForbidden('Antworten sind derzeit nur für Reparatur-Bewertungen verfügbar')
    }

    // Check if response already exists
    const existingResponse = await query(
      'SELECT id FROM review_responses WHERE review_id = $1',
      [reviewId]
    )

    if (existingResponse.rows.length > 0) {
      return apiBadRequest('Eine Antwort für diese Bewertung existiert bereits')
    }

    // Create response
    const responseResult = await query(`
      INSERT INTO review_responses (
        review_id, responder_id, content, status
      ) VALUES ($1, $2, $3, 'published')
      RETURNING id
    `, [reviewId, session.user.id, content.trim()])

    logger.info('Review response created', {
      reviewId,
      responseId: responseResult.rows[0].id,
      responderId: session.user.id
    })

    return apiSuccess({
      message: 'Antwort erfolgreich hinzugefügt',
      responseId: responseResult.rows[0].id
    }, 201)

  } catch (error) {
    logger.error('Error creating review response', { error, reviewId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const reviewId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return apiBadRequest('Antwort-Text ist erforderlich')
    }

    if (content.length > 2000) {
      return apiBadRequest('Antwort darf maximal 2000 Zeichen lang sein')
    }

    // Get response and check ownership
    const responseResult = await query(`
      SELECT rr.*, r.target_type, rp.user_id as repairer_user_id
      FROM review_responses rr
      JOIN reviews r ON rr.review_id = r.id
      LEFT JOIN repairer_profiles rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE rr.review_id = $1
    `, [reviewId])

    if (responseResult.rows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const response = responseResult.rows[0]

    // Check if user can edit this response
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    const isAdmin = isAdminRole(userResult.rows[0]?.role)
    const isOwner = response.responder_id === session.user.id
    const isRepairer = response.target_type === 'repairer' && response.repairer_user_id === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Sie können diese Antwort nicht bearbeiten')
    }

    // Update response
    await query(`
      UPDATE review_responses SET
        content = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE review_id = $2
    `, [content.trim(), reviewId])

    logger.info('Review response updated', {
      reviewId,
      responderId: session.user.id
    })

    return apiSuccess({
      message: 'Antwort erfolgreich aktualisiert'
    })

  } catch (error) {
    logger.error('Error updating review response', { error, reviewId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const reviewId = params.id

    // Get response and check ownership
    const responseResult = await query(`
      SELECT rr.responder_id, r.target_type, rp.user_id as repairer_user_id
      FROM review_responses rr
      JOIN reviews r ON rr.review_id = r.id
      LEFT JOIN repairer_profiles rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE rr.review_id = $1
    `, [reviewId])

    if (responseResult.rows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const response = responseResult.rows[0]

    // Check if user can delete this response
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [session.user.id]
    )

    const isAdmin = isAdminRole(userResult.rows[0]?.role)
    const isOwner = response.responder_id === session.user.id
    const isRepairer = response.target_type === 'repairer' && response.repairer_user_id === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Sie können diese Antwort nicht löschen')
    }

    // Delete response
    await query(
      'DELETE FROM review_responses WHERE review_id = $1',
      [reviewId]
    )

    logger.info('Review response deleted', {
      reviewId,
      deletedBy: session.user.id
    })

    return apiSuccess({
      message: 'Antwort erfolgreich gelöscht'
    })

  } catch (error) {
    logger.error('Error deleting review response', { error, reviewId: params.id })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}