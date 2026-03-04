import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
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
      return apiBadRequest('Admin-Notizen müssen ein Text sein')
    }

    // Get application details
    const applicationResult = await query(`
      SELECT ra.*, u.email, u.name
      FROM ${TABLE_NAMES.REPAIRER_APPLICATIONS} ra
      JOIN ${TABLE_NAMES.USERS} u ON ra.user_id = u.id
      WHERE ra.id = $1
    `, [applicationId])

    if (applicationResult.rows.length === 0) {
      return apiNotFound('Reparateur-Bewerbung nicht gefunden')
    }

    const application = applicationResult.rows[0] as ApplicationRow

    if (application.status === 'approved') {
      return apiBadRequest('Eine bereits genehmigte Bewerbung kann nicht zurückgewiesen werden')
    }

    if (application.status === 'rejected') {
      return apiBadRequest('Eine bereits abgelehnte Bewerbung kann nicht zurückgewiesen werden')
    }

    // Update application status to requires_changes
    await query(`
      UPDATE ${TABLE_NAMES.REPAIRER_APPLICATIONS}
      SET
        status = 'requires_changes',
        admin_notes = COALESCE($1, admin_notes) || E'\n\nGeforderte Änderungen: ' || $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [adminNotes, requestedChanges, session.user.id, applicationId])

    logger.info('Repairer application changes requested', {
      applicationId,
      adminId: session.user.id,
      userId: application.user_id,
      applicantEmail: application.email,
      requestedChanges
    })

    // Send notification email to applicant with requested changes
    const dashboardUrl = `${APP_URL}/dashboard/repairer/onboarding/apply`
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