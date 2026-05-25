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
import { APP_URL } from '@/config/urls'

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

    // Send all requests in parallel — one batch can carry hundreds of
    // recipients, and sequential awaits would block the admin's response
    // by ~200 ms × N. Promise.allSettled keeps per-recipient error tracking.
    const results = await Promise.allSettled(
      completed.map(registration => {
        const workshopDate = formatDateWithWeekday(registration.start_date)
        const feedbackUrl = `${APP_URL}/workshops/${registration.workshop_slug}#feedback`
        return sendEmail(
          registration.user_email!,
          'workshopFeedbackRequest',
          registration.user_name || 'Benutzer',
          registration.workshop_title,
          workshopDate,
          feedbackUrl
        )
      })
    )

    // sendEmail RESOLVES with { success: false, error } on SMTP/Listmonk
    // failure rather than throwing — `settled.status === 'fulfilled'` is
    // therefore true even when the email didn't go out, so the prior code
    // miscounted silent failures as sent. Check settled.value.success too.
    // Matches the repairer/apply admin-notifications pattern (d128beff).
    let sentCount = 0
    let failedCount = 0
    for (let i = 0; i < results.length; i++) {
      const settled = results[i]
      const registration = completed[i]
      if (settled.status === 'fulfilled' && settled.value.success) {
        sentCount++
        logger.info('Workshop feedback request sent', {
          registrationId: registration.registration_id,
          userId: registration.user_id,
          workshopTitle: registration.workshop_title,
        })
      } else if (settled.status === 'fulfilled') {
        failedCount++
        logger.warn('Failed to send workshop feedback request', {
          registrationId: registration.registration_id,
          error: settled.value.error,
        })
      } else {
        failedCount++
        logger.error('Unexpected exception sending workshop feedback request', {
          registrationId: registration.registration_id,
          error: settled.reason,
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
