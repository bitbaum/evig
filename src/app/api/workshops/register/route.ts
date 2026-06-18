import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { db } from '@/db'
import { workshops, workshopInstances, workshopRegistrations } from '@/db/schema'
import { eq, and, ne, count } from 'drizzle-orm'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/error-messages'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { WORKSHOP_INSTANCE_STATUS } from '@/config/workshops'
import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'
import { validateBody, WorkshopRegistrationSchema } from '@/lib/schemas'
import { APP_URL } from '@/config/urls'
import { notifyAllStaff } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

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

    // Duplicate check + INSERT must be atomic — two concurrent registrations
    // from the same user could both pass the check and create duplicate rows.
    // Excludes cancelled registrations so a user who explicitly cancelled can
    // re-register; without that filter the cancel route's set-status-to-
    // 'cancelled' (vs. row deletion) would lock them out forever with a
    // confusing 409.
    type RegisterResult =
      | { kind: 'already' }
      | { kind: 'noInstance' }
      | { kind: 'full' }
      | { kind: 'created'; registration: { id: string; createdAt: string | null }; instance: { id: string; startDate: string; location: string | null } }

    const txResult: RegisterResult = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: workshopRegistrations.id })
        .from(workshopRegistrations)
        .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
        .where(and(
          eq(workshopRegistrations.userId, session.user.id),
          eq(workshopInstances.workshopId, workshop.id),
          ne(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.CANCELLED),
        ))

      if (existing) return { kind: 'already' }

      const [instance] = await tx
        .select({
          id: workshopInstances.id,
          startDate: workshopInstances.startDate,
          location: workshopInstances.location,
          maxParticipants: workshopInstances.maxParticipants,
        })
        .from(workshopInstances)
        .where(and(
          eq(workshopInstances.workshopId, workshop.id),
          eq(workshopInstances.status, WORKSHOP_INSTANCE_STATUS.SCHEDULED)
        ))
        .orderBy(workshopInstances.startDate)
        .limit(1)
        // Lock the chosen instance so concurrent free registrations serialize
        // on the capacity check below (free regs don't track current_participants
        // like the paid path, so we count actual registrations instead).
        .for('update')

      if (!instance) return { kind: 'noInstance' }

      // Capacity check — count non-cancelled registrations against the cap.
      if (instance.maxParticipants != null) {
        const [{ taken }] = await tx
          .select({ taken: count() })
          .from(workshopRegistrations)
          .where(and(
            eq(workshopRegistrations.workshopInstanceId, instance.id),
            ne(workshopRegistrations.status, WORKSHOP_REGISTRATION_STATUS.CANCELLED),
          ))
        if (Number(taken) >= instance.maxParticipants) return { kind: 'full' }
      }

      const [registration] = await tx
        .insert(workshopRegistrations)
        .values({
          userId: session.user.id,
          workshopInstanceId: instance.id,
          status: WORKSHOP_REGISTRATION_STATUS.PENDING,
        })
        .returning({ id: workshopRegistrations.id, createdAt: workshopRegistrations.createdAt })

      return { kind: 'created', registration, instance }
    })

    if (txResult.kind === 'already') {
      return apiError(
        new Error('Already registered'),
        ERROR_MESSAGES.ALREADY_REGISTERED_WORKSHOP,
        409
      )
    }
    if (txResult.kind === 'noInstance') {
      return apiBadRequest(ERROR_MESSAGES.NO_WORKSHOP_INSTANCES)
    }
    if (txResult.kind === 'full') {
      return apiBadRequest('Workshop-Termin ist ausgebucht')
    }

    const { registration, instance } = txResult

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

    notifyAllStaff({
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Neue Workshop-Anmeldung',
      content: `${session.user.name || session.user.email} hat sich für «${workshop.title}» angemeldet.`,
      related_type: RELATED_TYPES.WORKSHOP,
      related_id: workshop.id,
    }).catch(() => {})

    return apiSuccess({
      message: SUCCESS_MESSAGES.WORKSHOP_REGISTERED,
      registrationId: registration.id,
      workshopTitle: workshop.title
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
