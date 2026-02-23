import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { SUPPORT_EMAIL } from '@/lib/constants'

interface ApplicationRow {
  user_id: string
  email: string
  name: string
  status: string
}

export const PUT = withAdmin<{ id: string }>(async (request, session, context) => {
  const { id: applicationId } = context!.params!
  try {
    const body = await request.json()
    const { adminNotes, rejectionReason } = body

    // Validate required fields
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return apiBadRequest('Ein Ablehnungsgrund ist erforderlich')
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
      return apiBadRequest('Eine bereits genehmigte Bewerbung kann nicht abgelehnt werden')
    }

    if (application.status === 'rejected') {
      return apiBadRequest('Diese Bewerbung wurde bereits abgelehnt')
    }

    // Update application status with rejection details
    await query(`
      UPDATE ${TABLE_NAMES.REPAIRER_APPLICATIONS}
      SET
        status = 'rejected',
        admin_notes = COALESCE($1, admin_notes) || E'\n\nAblehnungsgrund: ' || $2,
        reviewed_by = $3,
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
    `, [adminNotes, rejectionReason, session.user.id, applicationId])

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