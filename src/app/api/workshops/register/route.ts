import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'
import { validateBody, WorkshopRegistrationSchema } from '@/lib/schemas'
import { APP_URL } from '@/config/urls'

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json()
    const validation = validateBody(WorkshopRegistrationSchema, body)
    if (!validation.success) return validation.error
    const { workshopSlug } = validation.data

    // Find the workshop
    const [workshop] = await db
      .select({
        id: workshops.id,
        title: workshops.title,
        slug: workshops.slug,
        priceCents: workshops.priceCents,
      })
      .from(workshops)
      .where(and(eq(workshops.slug, workshopSlug), eq(workshops.isActive, true)))

    if (!workshop) {
      return apiNotFound('Workshop')
    }

    // Duplicate check + next instance lookup are independent — run in parallel
    const [existing, instance] = await Promise.all([
      db
        .select({ id: workshopRegistrations.id })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(and(
          eq(workshopRegistrations.userId, session.user.id),
          eq(workshopInstances.workshopId, workshop.id)
        ))
        .then(rows => rows[0]),
      db
        .select({
          id: workshopInstances.id,
          startDate: workshopInstances.startDate,
          location: workshopInstances.location,
        })
        .from(workshopInstances)
        .where(and(
          eq(workshopInstances.workshopId, workshop.id),
          eq(workshopInstances.status, WORKSHOP_INSTANCE_STATUS.SCHEDULED)
        ))
        .orderBy(workshopInstances.startDate)
        .limit(1)
        .then(rows => rows[0]),
    ])

    if (existing) {
      return apiError(
        new Error('Already registered'),
        'Bereits für diesen Workshop angemeldet',
        409
      )
    }

    if (!instance) {
      return apiBadRequest('Aktuell sind keine Termine für diesen Workshop verfügbar')
    }

    // Create the registration
    const [registration] = await db
      .insert(workshopRegistrations)
      .values({
        userId: session.user.id,
        workshopInstanceId: instance.id,
        status: WORKSHOP_REGISTRATION_STATUS.PENDING,
      })
      .returning({ id: workshopRegistrations.id, createdAt: workshopRegistrations.createdAt })

    // Send registration confirmation email — user details come from session (no extra RTT)
    const workshopUrl = `${APP_URL}/workshops/${workshop.slug}`
    const workshopDate = formatDateTimeWithWeekday(instance.startDate)

    try {
      await sendEmail(
        session.user.email,
        'workshopRegistrationConfirmation',
        session.user.name || 'Benutzer',
        workshop.title,
        workshopDate,
        instance.location || 'Wird noch bekannt gegeben',
        workshop.priceCents || 0,
        workshopUrl
      )
      logger.info('Workshop registration confirmation email sent', {
        userId: session.user.id,
        workshopId: workshop.id,
        registrationId: registration.id
      })
    } catch (emailError) {
      logger.error('Failed to send workshop registration email', { error: emailError })
    }

    return apiSuccess({
      message: 'Erfolgreich für Workshop angemeldet',
      registrationId: registration.id,
      workshopTitle: workshop.title
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
