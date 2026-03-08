import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { DOCUMENT_STATUS, type DocumentStatus } from '@/config/document-status'
import { logger } from '@/lib/logger'

interface DocumentRow {
  id: string
  application_id: string
  user_id: string
  status: string
  document_verification_status: string
}

interface RequiredDocsRow {
  total_required: string
  approved_required: string
}

export const PUT = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: documentId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes, expiresAt } = body

    // Validate inputs
    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    if (expiresAt && isNaN(Date.parse(expiresAt))) {
      return apiBadRequest('Ungültiges Ablaufdatum')
    }

    // Get document details and check if it exists (read-only, outside transaction)
    const documentResult = await query(`
      SELECT vd.*, ra.user_id, ra.document_verification_status
      FROM ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd
      JOIN ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra ON vd.application_id = ra.id
      WHERE vd.id = $1
    `, [documentId])

    if (documentResult.rows.length === 0) {
      return apiNotFound('Dokument nicht gefunden')
    }

    const document = documentResult.rows[0] as DocumentRow

    if (document.status === DOCUMENT_STATUS.APPROVED) {
      return apiBadRequest('Dieses Dokument wurde bereits genehmigt')
    }

    // Wrap all writes in a transaction for consistency
    const newStatus = await transaction(async (client) => {
      // Update document status
      await client.query(`
        UPDATE ${TABLE_NAMES.VERIFICATION_DOCUMENTS}
        SET
          status = '${DOCUMENT_STATUS.APPROVED}',
          admin_notes = COALESCE($1, admin_notes),
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP,
          expires_at = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [adminNotes, session.user.id, expiresAt || null, documentId])

      // Check if all required documents for this application are now approved
      const requiredDocsResult = await client.query(`
        SELECT COUNT(*) as total_required,
               COUNT(CASE WHEN vd.status = '${DOCUMENT_STATUS.APPROVED}' THEN 1 END) as approved_required
        FROM ${TABLE_NAMES.DOCUMENT_TYPES} dt
        LEFT JOIN ${TABLE_NAMES.VERIFICATION_DOCUMENTS} vd ON dt.id = vd.document_type_id
          AND vd.application_id = $1
        WHERE dt.is_required = true
      `, [document.application_id])

      const requiredDocs = requiredDocsResult.rows[0] as RequiredDocsRow
      const totalRequired = parseInt(requiredDocs.total_required) || 0
      const approvedRequired = parseInt(requiredDocs.approved_required) || 0

      // Determine new application document verification status
      let status: DocumentStatus = DOCUMENT_STATUS.PENDING
      if (approvedRequired === totalRequired && totalRequired > 0) {
        status = DOCUMENT_STATUS.APPROVED
      } else if (approvedRequired > 0 && approvedRequired < totalRequired) {
        status = DOCUMENT_STATUS.IN_REVIEW
      }

      // Update application document verification status
      await client.query(`
        UPDATE ${TABLE_NAMES.REPAIRER_APPLICATIONS}
        SET document_verification_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [status, document.application_id])

      return status
    })

    logger.info('Document approved', {
      documentId,
      adminId: session.user.id,
      applicationId: document.application_id,
      userId: document.user_id,
      newVerificationStatus: newStatus
    })

    return apiSuccess({
      message: 'Dokument erfolgreich genehmigt',
      documentId,
      applicationDocumentStatus: newStatus
    })

  } catch (error) {
    logger.error('Error approving document', { error, documentId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})