import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { isAdminRole } from '@/lib/constants'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params
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
      return apiUnauthorized('Nur Administratoren können diese Funktion verwenden')
    }
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required inputs
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest('Ein Ablehnungsgrund ist erforderlich')
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get document details
    const documentResult = await query(`
      SELECT vd.*, ra.user_id, ra.document_verification_status
      FROM ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd
      JOIN ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra ON vd.application_id = ra.id
      WHERE vd.id = $1
    `, [documentId])

    if (documentResult.rows.length === 0) {
      return apiNotFound('Dokument nicht gefunden')
    }

    const document = documentResult.rows[0]

    if (document.status === 'approved') {
      return apiBadRequest('Ein bereits genehmigtes Dokument kann nicht abgelehnt werden')
    }

    if (document.status === 'rejected') {
      return apiBadRequest('Dieses Dokument wurde bereits abgelehnt')
    }

    // Update document status with rejection details
    await query(`
      UPDATE ${TABLE_NAMES.VERIFICATION_DOCUMENTS}
      SET
        status = 'rejected',
        admin_notes = COALESCE($1, admin_notes) || E'\n\nAblehnungsgrund: ' || $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [adminNotes, rejectionReason, session.user.id, documentId])

    // Update application document verification status to incomplete
    await query(`
      UPDATE ${TABLE_NAMES.REPAIRER_APPLICATIONS}
      SET document_verification_status = 'incomplete', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [document.application_id])

    logger.info('Document rejected', {
      documentId,
      adminId: session.user.id,
      applicationId: document.application_id,
      userId: document.user_id,
      rejectionReason
    })

    return apiSuccess({
      message: 'Dokument erfolgreich abgelehnt',
      documentId,
      applicationDocumentStatus: 'incomplete'
    })

  } catch (error) {
    logger.error('Error rejecting document', { error, documentId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}