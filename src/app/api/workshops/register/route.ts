import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'
import { validateBody, WorkshopRegistrationSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

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

    // Check if user is already registered for this workshop
    const [existing] = await db
      .select({ id: workshopRegistrations.id })
      .from(workshopRegistrations)
      .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
      .where(and(
        eq(workshopRegistrations.userId, session.user.id),
        eq(workshopInstances.workshopId, workshop.id)
      ))

    if (existing) {
      return apiError(
        new Error('Already registered'),
        'Bereits für diesen Workshop angemeldet',
        409
      )
    }

    // Find the next scheduled instance for this workshop
    const [instance] = await db
      .select({ id: workshopInstances.id })
      .from(workshopInstances)
      .where(and(
        eq(workshopInstances.workshopId, workshop.id),
        eq(workshopInstances.status, 'scheduled')
      ))
      .orderBy(workshopInstances.startDate)
      .limit(1)

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

    // Get user details and workshop instance for email
    const [user] = await db
      .select({ name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, session.user.id))

    const [instanceDetails] = await db
      .select({ startDate: workshopInstances.startDate, location: workshopInstances.location })
      .from(workshopInstances)
      .where(eq(workshopInstances.id, instance.id))

    // Send registration confirmation email
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://revampit.ch'
    const workshopUrl = `${baseUrl}/workshops/${workshop.slug}`
    const workshopDate = formatDateTimeWithWeekday(instanceDetails.startDate)

    try {
      await sendEmail(
        user.email,
        'workshopRegistrationConfirmation',
        user.name || 'Benutzer',
        workshop.title,
        workshopDate,
        instanceDetails.location || 'Wird noch bekannt gegeben',
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
}
