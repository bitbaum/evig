import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

interface ReviewRow {
  id: string
  target_type: string
  target_id: string
  repairer_user_id: string | null
}

interface UserRow {
  role: string
}

interface ResponseIdRow {
  id: string
}

interface ResponseRow {
  id: string
  responder_id: string
  target_type: string
  repairer_user_id: string | null
}

export async function POST(
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
      FROM ${TABLE_NAMES.REVIEWS} r
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE r.id = $1
    `, [reviewId])

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const review = reviewResult.rows[0] as ReviewRow

    // Check if user is the repairer being reviewed
    if (review.target_type === 'repairer' && review.repairer_user_id !== session.user.id) {
      return apiForbidden('Nur der bewertete Reparateur kann auf Bewertungen antworten')
    }

    // Check if user is admin (admins can respond on behalf of repairers)
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    const user = userResult.rows[0] as UserRow | undefined
    const isAdmin = isAdminRole(user?.role)

    if (review.target_type !== 'repairer' && !isAdmin) {
      return apiForbidden('Antworten sind derzeit nur für Reparatur-Bewertungen verfügbar')
    }

    // Check if response already exists
    const existingResponse = await query(
      `SELECT id FROM ${TABLE_NAMES.REVIEW_RESPONSES} WHERE review_id = $1`,
      [reviewId]
    )

    if (existingResponse.rows.length > 0) {
      return apiBadRequest('Eine Antwort für diese Bewertung existiert bereits')
    }

    // Create response
    const responseResult = await query(`
      INSERT INTO ${TABLE_NAMES.REVIEW_RESPONSES} (
        review_id, responder_id, content, status
      ) VALUES ($1, $2, $3, 'published')
      RETURNING id
    `, [reviewId, session.user.id, content.trim()])

    const createdResponse = responseResult.rows[0] as ResponseIdRow

    logger.info('Review response created', {
      reviewId,
      responseId: createdResponse.id,
      responderId: session.user.id
    })

    return apiSuccess({
      message: 'Antwort erfolgreich hinzugefügt',
      responseId: createdResponse.id
    }, 201)

  } catch (error) {
    logger.error('Error creating review response', { error, reviewId })
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
      FROM ${TABLE_NAMES.REVIEW_RESPONSES} rr
      JOIN ${TABLE_NAMES.REVIEWS} r ON rr.review_id = r.id
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE rr.review_id = $1
    `, [reviewId])

    if (responseResult.rows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const response = responseResult.rows[0] as ResponseRow

    // Check if user can edit this response
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    const userForEdit = userResult.rows[0] as UserRow | undefined
    const isAdmin = isAdminRole(userForEdit?.role)
    const isOwner = response.responder_id === session.user.id
    const isRepairer = response.target_type === 'repairer' && response.repairer_user_id === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Sie können diese Antwort nicht bearbeiten')
    }

    // Update response
    await query(`
      UPDATE ${TABLE_NAMES.REVIEW_RESPONSES} SET
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
    logger.error('Error updating review response', { error, reviewId })
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

    // Get response and check ownership
    const responseResult = await query(`
      SELECT rr.responder_id, r.target_type, rp.user_id as repairer_user_id
      FROM ${TABLE_NAMES.REVIEW_RESPONSES} rr
      JOIN ${TABLE_NAMES.REVIEWS} r ON rr.review_id = r.id
      LEFT JOIN ${TABLE_NAMES.REPAIRER_PROFILES} rp ON r.target_type = 'repairer' AND r.target_id = rp.id
      WHERE rr.review_id = $1
    `, [reviewId])

    if (responseResult.rows.length === 0) {
      return apiNotFound('Antwort nicht gefunden')
    }

    const responseToDelete = responseResult.rows[0] as ResponseRow

    // Check if user can delete this response
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    const userForDelete = userResult.rows[0] as UserRow | undefined
    const isAdmin = isAdminRole(userForDelete?.role)
    const isOwner = responseToDelete.responder_id === session.user.id
    const isRepairer = responseToDelete.target_type === 'repairer' && responseToDelete.repairer_user_id === session.user.id

    if (!isOwner && !isAdmin && !isRepairer) {
      return apiForbidden('Sie können diese Antwort nicht löschen')
    }

    // Delete response
    await query(
      `DELETE FROM ${TABLE_NAMES.REVIEW_RESPONSES} WHERE review_id = $1`,
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
    logger.error('Error deleting review response', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}