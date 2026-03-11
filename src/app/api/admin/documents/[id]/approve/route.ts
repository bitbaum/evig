import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
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
    const documentResult = await db.execute(sql`
      SELECT vd.*, ra.user_id, ra.document_verification_status
      FROM ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)} vd
      JOIN ${sql.raw(TABLE_NAMES.REPAIRER_APPLICATIONS)} ra ON vd.application_id = ra.id
      WHERE vd.id = ${documentId}
    `)

    if (documentResult.rows.length === 0) {
      return apiNotFound('Dokument nicht gefunden')
    }

    const document = documentResult.rows[0] as unknown as DocumentRow

    if (document.status === DOCUMENT_STATUS.APPROVED) {
      return apiBadRequest('Dieses Dokument wurde bereits genehmigt')
    }

    // Wrap all writes in a transaction for consistency
    const newStatus = await db.transaction(async (tx) => {
      // Update document status
      await tx.execute(sql`
        UPDATE ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)}
        SET
          status = ${DOCUMENT_STATUS.APPROVED},
          admin_notes = COALESCE(${adminNotes ?? null}, admin_notes),
          reviewed_by = ${session.user.id},
          reviewed_at = CURRENT_TIMESTAMP,
          expires_at = ${expiresAt || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${documentId}
      `)

      // Check if all required documents for this application are now approved
      const requiredDocsResult = await tx.execute(sql`
        SELECT COUNT(*) as total_required,
               COUNT(CASE WHEN vd.status = ${DOCUMENT_STATUS.APPROVED} THEN 1 END) as approved_required
        FROM ${sql.raw(TABLE_NAMES.DOCUMENT_TYPES)} dt
        LEFT JOIN ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)} vd ON dt.id = vd.document_type_id
          AND vd.application_id = ${document.application_id}
        WHERE dt.is_required = true
      `)

      const requiredDocs = requiredDocsResult.rows[0] as unknown as RequiredDocsRow
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
      await tx.execute(sql`
        UPDATE ${sql.raw(TABLE_NAMES.REPAIRER_APPLICATIONS)}
        SET document_verification_status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${document.application_id}
      `)

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
