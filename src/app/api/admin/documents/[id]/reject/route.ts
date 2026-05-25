import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { repairerApplications } from '@/db/schema'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { DOCUMENT_STATUS } from '@/config/document-status'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notificationEmail } from '@/lib/email/templates/notification'
import { CONTACT } from '@/config/org'

interface DocumentRow {
  id: string
  application_id: string
  user_id: string
  status: string
  document_verification_status: string
  user_email?: string
  user_name?: string
}

export const PUT = withAdmin<{ id: string }>('content', async (request, session, context) => {
  const { id: documentId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required inputs
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.REJECTION_REASON_REQUIRED)
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.ADMIN_NOTES_MUST_BE_STRING)
    }

    // Get document details (read-only, outside transaction)
    const documentResult = await db.execute(sql`
      SELECT vd.*, ra.user_id, ra.document_verification_status,
             u.email as user_email, u.name as user_name
      FROM ${sql.raw(TABLE_NAMES.VERIFICATION_DOCUMENTS)} vd
      JOIN ${sql.raw(getTableName(repairerApplications))} ra ON vd.application_id = ra.id
      JOIN ${sql.raw(TABLE_NAMES.USERS)} u ON ra.user_id = u.id
      WHERE vd.id = ${documentId}
    `)

    if (documentResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.DOCUMENT_NOT_FOUND)
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
        UPDATE ${sql.raw(getTableName(repairerApplications))}
        SET document_verification_status = ${DOCUMENT_STATUS.INCOMPLETE}, updated_at = CURRENT_TIMESTAMP
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

    // Fire-and-forget email to applicant. sendCustomEmail RESOLVES with
    // {success:false,error} on SMTP/Listmonk failure rather than throwing.
    // Same shape as the document-approval fix in this commit — surface
    // resolved-failures under a distinct log key. Especially load-bearing
    // for rejection: applicants need the rejection reason to know what
    // to fix; without the email + with no in-app fallback they're stuck
    // wondering what happened.
    if (document.user_email) {
      sendCustomEmail(
        document.user_email,
        notificationEmail(
          'Dein Dokument wurde abgelehnt',
          `Dein eingereichtes Dokument wurde leider abgelehnt. Grund: ${rejectionReason}\n\nBei Fragen wende dich bitte an ${CONTACT.supportEmail}.`,
        ),
      )
        .then((result) => {
          if (!result.success) {
            logger.warn('Document rejection email failed (resolved)', {
              error: result.error,
              documentId,
              userId: document.user_id,
            })
          }
        })
        .catch((err) =>
          logger.error('Document rejection email failed (rejected)', {
            error: err,
            documentId,
            userId: document.user_id,
          }),
        )
    }

    return apiSuccess({
      message: 'Dokument erfolgreich abgelehnt',
      documentId,
      applicationDocumentStatus: DOCUMENT_STATUS.INCOMPLETE
    })

  } catch (error) {
    logger.error('Error rejecting document', { error, documentId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
