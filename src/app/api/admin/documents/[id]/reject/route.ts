import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { DOCUMENT_STATUS } from '@/config/document-status'
import { logger } from '@/lib/logger'

interface DocumentRow {
  id: string
  application_id: string
  user_id: string
  status: string
  document_verification_status: string
}

export const PUT = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: documentId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required inputs
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest('Ein Ablehnungsgrund ist erforderlich')
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get document details (read-only, outside transaction)
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
      return apiBadRequest('Ein bereits genehmigtes Dokument kann nicht abgelehnt werden')
    }

    if (document.status === DOCUMENT_STATUS.REJECTED) {
      return apiBadRequest('Dieses Dokument wurde bereits abgelehnt')
    }

    // Wrap all writes in a transaction for consistency
    await db.transaction(async (tx) => {
      // Update document status with rejection details
      await tx.execute(sql`
        UPDATE ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)}
        SET
          status = ${DOCUMENT_STATUS.REJECTED},
          admin_notes = COALESCE(${adminNotes ?? null}, admin_notes) || E'\n\nAblehnungsgrund: ' || ${rejectionReason},
          reviewed_by = ${session.user.id},
          reviewed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${documentId}
      `)

      // Update application document verification status to incomplete
      await tx.execute(sql`
        UPDATE ${sql.raw(TABLE_NAMES.REPAIRER_APPLICATIONS)}
        SET document_verification_status = ${'incomplete'}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${document.application_id}
      `)
    })

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
})
