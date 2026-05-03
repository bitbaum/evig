import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { repairerApplications, users } from '@/db/schema'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { SUPPORT_EMAIL } from '@/lib/constants'

interface ApplicationRow {
  user_id: string
  email: string
  name: string
  status: string
}

export const PUT = withAdmin<{ id: string }>('services', async (request, session, context) => {
  const { id: applicationId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required fields
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.REJECTION_REASON_REQUIRED)
    }

    if (adminNotes && typeof adminNotes !== 'string') {
      return apiBadRequest(ERROR_MESSAGES.ADMIN_NOTES_MUST_BE_STRING)
    }

    // Get application details
    const applicationResult = await db.execute(sql`
      SELECT ra.*, u.email, u.name
      FROM ${sql.raw(getTableName(repairerApplications))} ra
      JOIN ${sql.raw(getTableName(users))} u ON ra.user_id = u.id
      WHERE ra.id = ${applicationId}
    `)

    if (applicationResult.rows.length === 0) {
      return apiNotFound(ERROR_MESSAGES.REPAIRER_APPLICATION_NOT_FOUND)
    }

    const application = applicationResult.rows[0] as unknown as ApplicationRow

    if (application.status === APPROVAL_STATUS.APPROVED) {
      return apiBadRequest('Eine bereits genehmigte Bewerbung kann nicht abgelehnt werden')
    }

    if (application.status === APPROVAL_STATUS.REJECTED) {
      return apiBadRequest('Diese Bewerbung wurde bereits abgelehnt')
    }

    // Update application status with rejection details
    await db.execute(sql`
      UPDATE ${sql.raw(getTableName(repairerApplications))}
      SET
        status = ${APPROVAL_STATUS.REJECTED},
        admin_notes = COALESCE(${adminNotes ?? null}, admin_notes) || E'\n\nAblehnungsgrund: ' || ${rejectionReason},
        reviewed_by = ${session.user.id},
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${applicationId}
    `)

    logger.info('Repairer application rejected', {
      applicationId,
      adminId: session.user.id,
      userId: application.user_id,
      applicantEmail: application.email,
      rejectionReason
    })

    // Send rejection notification email to applicant
    const supportEmail = SUPPORT_EMAIL
    const rejectionEmailResult = await sendEmail(
      application.email,
      'repairerApplicationRejected',
      application.name || 'Reparateur-Bewerber',
      rejectionReason,
      supportEmail
    )

    if (!rejectionEmailResult.success) {
      logger.warn('Failed to send repairer application rejection email', {
        applicationId,
        applicantEmail: application.email,
        error: rejectionEmailResult.error
      })
    }

    return apiSuccess({
      message: 'Reparateur-Bewerbung erfolgreich abgelehnt',
      applicationId
    })

  } catch (error) {
    logger.error('Error rejecting repairer application', { error, applicationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
