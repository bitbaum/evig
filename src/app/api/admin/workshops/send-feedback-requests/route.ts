import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { validateBody, AdminSendFeedbackRequestsSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { TABLE_NAMES } from '@/config/database'
import { sendEmail } from '@/lib/email'
import { formatDateWithWeekday } from '@/lib/date-formats'

interface CompletedWorkshopRow {
  instance_id: string
  workshop_title: string
  workshop_slug: string
  start_date: string
  user_id: string
  user_name: string
  user_email: string
  registration_id: string
}

// POST /api/admin/workshops/send-feedback-requests - Send feedback requests for completed workshops
export const POST = withAdmin('workshops-admin', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(AdminSendFeedbackRequestsSchema, body)
    if (!validation.success) return validation.error
    const { daysAfterWorkshop } = validation.data

    // Get all attended registrations for workshops that completed recently and have no feedback yet
    const completedResult = await query(`
      SELECT
        wi.id as instance_id,
        w.title as workshop_title,
        w.slug as workshop_slug,
        wi.start_date,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        wr.id as registration_id
      FROM ${TABLE_NAMES.WORKSHOP_REGISTRATIONS} wr
      JOIN ${TABLE_NAMES.WORKSHOP_INSTANCES} wi ON wr.workshop_instance_id = wi.id
      JOIN ${TABLE_NAMES.WORKSHOPS} w ON wi.workshop_id = w.id
      JOIN ${TABLE_NAMES.USERS} u ON wr.user_id = u.id
      WHERE (wr.status = 'attended' OR wr.attended = true)
        AND wr.rating IS NULL
        AND wr.feedback IS NULL
        AND wi.start_date < NOW()
        AND wi.start_date >= NOW() - make_interval(days => $1)
      ORDER BY wi.start_date DESC
    `, [daysAfterWorkshop + 7])

    const workshops = completedResult.rows as CompletedWorkshopRow[]
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'

    let sentCount = 0
    let failedCount = 0

    for (const registration of workshops) {
      try {
        const workshopDate = formatDateWithWeekday(registration.start_date)
        // Link to the workshop page where they can leave feedback
        const feedbackUrl = `${baseUrl}/workshops/${registration.workshop_slug}#feedback`

        await sendEmail(
          registration.user_email,
          'workshopFeedbackRequest',
          registration.user_name || 'Benutzer',
          registration.workshop_title,
          workshopDate,
          feedbackUrl
        )

        sentCount++
        logger.info('Workshop feedback request sent', {
          registrationId: registration.registration_id,
          userId: registration.user_id,
          workshopTitle: registration.workshop_title
        })
      } catch (emailError) {
        failedCount++
        logger.error('Failed to send workshop feedback request', {
          registrationId: registration.registration_id,
          error: emailError
        })
      }
    }

    return apiSuccess({
      message: `Feedback requests sent successfully`,
      total: workshops.length,
      sent: sentCount,
      failed: failedCount
    })

  } catch (error) {
    logger.error('Error sending workshop feedback requests', { error })
    return apiError(error, 'Failed to send feedback requests')
  }
})
