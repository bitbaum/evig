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
import { APP_URL } from '@/config/urls'

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
    const { requestedChanges, adminNotes } = body

    // Validate required fields
    if (!requestedChanges || typeof requestedChanges !== 'string') {
      return apiBadRequest('Geforderte Änderungen sind erforderlich')
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
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    const application = applicationResult.rows[0] as unknown as ApplicationRow

    if (application.status === APPROVAL_STATUS.APPROVED) {
      return apiBadRequest('Eine bereits genehmigte Bewerbung kann nicht zurückgewiesen werden')
    }

    if (application.status === APPROVAL_STATUS.REJECTED) {
      return apiBadRequest('Eine bereits abgelehnte Bewerbung kann nicht zurückgewiesen werden')
    }

    // Update application status to requires_changes
    await db.execute(sql`
      UPDATE ${sql.raw(getTableName(repairerApplications))}
      SET
        status = ${APPROVAL_STATUS.REQUIRES_CHANGES},
        admin_notes = COALESCE(${adminNotes ?? null}, admin_notes) || E'\n\nGeforderte Änderungen: ' || ${requestedChanges},
        reviewed_by = ${session.user.id},
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${applicationId}
    `)

    logger.info('Repairer application changes requested', {
      applicationId,
      adminId: session.user.id,
      userId: application.user_id,
      applicantEmail: application.email,
      requestedChanges
    })

    // Send notification email to applicant with requested changes
    const dashboardUrl = `${APP_URL}/profil/techniker`
    const changesEmailResult = await sendEmail(
      application.email,
      'repairerApplicationChangesRequested',
      application.name || 'Reparateur-Bewerber',
      requestedChanges,
      dashboardUrl
    )

    if (!changesEmailResult.success) {
      logger.warn('Failed to send repairer application changes requested email', {
        applicationId,
        applicantEmail: application.email,
        error: changesEmailResult.error
      })
    }

    return apiSuccess({
      message: 'Änderungen wurden von der Bewerbung gefordert',
      applicationId
    })

  } catch (error) {
    logger.error('Error requesting changes for repairer application', { error, applicationId })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
