import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopRegistrations, workshopInstances, workshops, users } from '@/db/schema'
import { eq, and, or, lt, gte, isNull, sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { validateBody, AdminSendFeedbackRequestsSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { sendEmail } from '@/lib/email'
import { formatDateWithWeekday } from '@/lib/date-formats'

// POST /api/admin/workshops/send-feedback-requests - Send feedback requests for completed workshops
export const POST = withAdmin('workshops-admin', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(AdminSendFeedbackRequestsSchema, body)
    if (!validation.success) return validation.error
    const { daysAfterWorkshop } = validation.data

    // Get all attended registrations for workshops that completed recently and have no feedback yet
    const completed = await db
      .select({
        instance_id: workshopInstances.id,
        workshop_title: workshops.title,
        workshop_slug: workshops.slug,
        start_date: workshopInstances.startDate,
        user_id: users.id,
        user_name: users.name,
        user_email: users.email,
        registration_id: workshopRegistrations.id,
      })
      .from(workshopRegistrations)
      .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
      .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
      .innerJoin(users, eq(workshopRegistrations.userId, users.id))
      .where(and(
        or(
          eq(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.ATTENDED),
          eq(workshopRegistrations.attended, true)
        ),
        isNull(workshopRegistrations.rating),
        isNull(workshopRegistrations.feedback),
        lt(workshopInstances.startDate, sql`NOW()`),
        gte(workshopInstances.startDate, sql`NOW() - make_interval(days => ${daysAfterWorkshop + 7})`)
      ))
      .orderBy(sql`${workshopInstances.startDate} DESC`)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'

    let sentCount = 0
    let failedCount = 0

    for (const registration of completed) {
      try {
        const workshopDate = formatDateWithWeekday(registration.start_date)
        const feedbackUrl = `${baseUrl}/workshops/${registration.workshop_slug}#feedback`

        await sendEmail(
          registration.user_email!,
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
      total: completed.length,
      sent: sentCount,
      failed: failedCount
    })

  } catch (error) {
    logger.error('Error sending workshop feedback requests', { error })
    return apiError(error, 'Failed to send feedback requests')
  }
})
