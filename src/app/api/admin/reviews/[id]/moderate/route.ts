import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

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

    // Check if user is admin using SSOT helper
    const userResult = await query(
      `SELECT role FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [session.user.id]
    )

    if (!userResult.rows[0] || !isAdminRole(userResult.rows[0].role)) {
      return apiUnauthorized('Nur Administratoren können Bewertungen moderieren')
    }
    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'hide', 'delete', 'restore', 'flag_spam', 'flag_inappropriate'].includes(action)) {
      return apiBadRequest('Ungültige Moderations-Aktion')
    }

    if (!reason || typeof reason !== 'string') {
      return apiBadRequest('Moderations-Grund ist erforderlich')
    }

    // Get current review status
    const reviewResult = await query(
      `SELECT status FROM ${TABLE_NAMES.REVIEWS} WHERE id = $1`,
      [reviewId]
    )

    if (reviewResult.rows.length === 0) {
      return apiNotFound('Bewertung nicht gefunden')
    }

    const oldStatus = reviewResult.rows[0].status
    let newStatus = oldStatus

    // Determine new status based on action
    switch (action) {
      case 'approve':
        newStatus = 'published'
        break
      case 'hide':
        newStatus = 'hidden'
        break
      case 'delete':
        newStatus = 'deleted'
        break
      case 'restore':
        newStatus = 'published'
        break
      case 'flag_spam':
      case 'flag_inappropriate':
        newStatus = 'hidden'
        break
    }

    // Update review status and moderation info
    await query(`
      UPDATE ${TABLE_NAMES.REVIEWS} SET
        status = $1,
        moderation_reason = $2,
        moderated_by = $3,
        moderated_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [newStatus, reason, session.user.id, reviewId])

    // Log moderation action
    await query(`
      INSERT INTO ${TABLE_NAMES.REVIEW_MODERATION_LOG} (
        review_id, action, reason, admin_id, old_status, new_status
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `, [reviewId, action, reason, session.user.id, oldStatus, newStatus])

    logger.info('Review moderated', {
      reviewId,
      action,
      oldStatus,
      newStatus,
      adminId: session.user.id
    })

    return apiSuccess({
      message: `Bewertung erfolgreich ${action === 'approve' ? 'freigegeben' : action === 'hide' ? 'ausgeblendet' : action === 'delete' ? 'gelöscht' : 'moderiert'}`,
      reviewId,
      action,
      oldStatus,
      newStatus
    })

  } catch (error) {
    logger.error('Error moderating review', { error, reviewId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}