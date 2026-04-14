import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshopRegistrations, workshopInstances, workshops, users } from '@/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { validateBody, AdminSendRemindersSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { sendEmail } from '@/lib/email'
import { formatDateWithWeekday } from '@/lib/date-formats'
import { APP_URL } from '@/config/urls'

// POST /api/admin/workshops/send-reminders - Send reminders for upcoming workshops
export const POST = withAdmin('workshops-admin', async (request, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(AdminSendRemindersSchema, body)
    if (!validation.success) return validation.error
    const { daysBeforeWorkshop } = validation.data

    // Get all confirmed registrations for workshops happening in the specified days
    const upcoming = await db
      .select({
        instance_id: workshopInstances.id,
        workshop_title: workshops.title,
        workshop_slug: workshops.slug,
        start_date: workshopInstances.startDate,
        location: workshopInstances.location,
        instructor: workshopInstances.instructor,
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
        eq(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.CONFIRMED),
        eq(workshopInstances.status, WORKSHOP_INSTANCE_STATUS.SCHEDULED),
        gte(workshopInstances.startDate, sql`NOW()`),
        lte(workshopInstances.startDate, sql`NOW() + make_interval(days => ${daysBeforeWorkshop})`)
      ))
      .orderBy(workshopInstances.startDate)

    let sentCount = 0
    let failedCount = 0

    for (const registration of upcoming) {
      try {
        const workshopDate = formatDateWithWeekday(registration.start_date)
        const workshopTime = new Date(registration.start_date).toLocaleTimeString('de-CH', {
          hour: '2-digit',
          minute: '2-digit'
        })
        const workshopUrl = `${APP_URL}/workshops/${registration.workshop_slug}`

        await sendEmail(
          registration.user_email!,
          'workshopReminder',
          registration.user_name || 'Benutzer',
          registration.workshop_title,
          workshopDate,
          workshopTime,
          registration.location || 'Wird noch bekannt gegeben',
          registration.instructor,
          workshopUrl
        )

        sentCount++
        logger.info('Workshop reminder sent', {
          registrationId: registration.registration_id,
          userId: registration.user_id,
          workshopTitle: registration.workshop_title
        })
      } catch (emailError) {
        failedCount++
        logger.error('Failed to send workshop reminder', {
          registrationId: registration.registration_id,
          error: emailError
        })
      }
    }

    return apiSuccess({
      message: `Reminders sent successfully`,
      total: upcoming.length,
      sent: sentCount,
      failed: failedCount
    })

  } catch (error) {
    logger.error('Error sending workshop reminders', { error })
    return apiError(error, 'Failed to send reminders')
  }
})
