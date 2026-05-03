import { NextRequest } from 'next/server'
import { db } from '@/db'
import { workshopRegistrations, workshopInstances, workshops, users } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess, apiNotFound, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateBody, AdminWorkshopRegistrationUpdateSchema } from '@/lib/schemas'
import { logger } from '@/lib/logger'
import { WORKSHOP_REGISTRATION_STATUS, type WorkshopRegistrationStatus } from '@/config/workshop-registration-status'
import { sendEmail } from '@/lib/email'
import { formatDateTimeWithWeekday } from '@/lib/date-formats'

// PUT /api/admin/workshops/registrations/[id] - Update registration status
export const PUT = withAdmin<{ id: string }>('workshops-admin', async (request, session, context) => {
  try {
    const { id } = context!.params!
    const body = await request.json()
    const validation = validateBody(AdminWorkshopRegistrationUpdateSchema, body)
    if (!validation.success) return validation.error
    const { status, attended, notes } = validation.data

    // Check registration exists
    const [existing] = await db
      .select({ id: workshopRegistrations.id })
      .from(workshopRegistrations)
      .where(eq(workshopRegistrations.id, id))

    if (!existing) {
      return apiNotFound('Registration not found')
    }

    // Build dynamic update
    const update: Record<string, unknown> = {}

    if (status !== undefined) {
      update.status = status
      if (status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED) {
        update.confirmedAt = sql`NOW()`
      }
      if (status === WORKSHOP_REGISTRATION_STATUS.CANCELLED) {
        update.cancelledAt = sql`NOW()`
      }
    }

    if (attended !== undefined) update.attended = attended
    if (notes !== undefined) update.notes = notes

    if (Object.keys(update).length === 0) {
      return apiBadRequest(ERROR_MESSAGES.NO_FIELDS_TO_UPDATE)
    }

    await db
      .update(workshopRegistrations)
      .set(update)
      .where(eq(workshopRegistrations.id, id))

    logger.info('Workshop registration updated', {
      registrationId: id,
      updatedBy: session.user.id,
      newStatus: status
    })

    // Send email notification for status changes
    if (status && (status === WORKSHOP_REGISTRATION_STATUS.CONFIRMED || status === WORKSHOP_REGISTRATION_STATUS.CANCELLED || status === WORKSHOP_REGISTRATION_STATUS.WAITLIST)) {
      try {
        const [details] = await db
          .select({
            userId: workshopRegistrations.userId,
            userName: users.name,
            userEmail: users.email,
            workshopTitle: workshops.title,
            startDate: workshopInstances.startDate,
          })
          .from(workshopRegistrations)
          .innerJoin(users, eq(workshopRegistrations.userId, users.id))
          .innerJoin(workshopInstances, eq(workshopRegistrations.workshopInstanceId, workshopInstances.id))
          .innerJoin(workshops, eq(workshopInstances.workshopId, workshops.id))
          .where(eq(workshopRegistrations.id, id))

        if (details) {
          const workshopDate = formatDateTimeWithWeekday(details.startDate)

          await sendEmail(
            details.userEmail,
            'workshopRegistrationStatusUpdate',
            details.userName || 'Benutzer',
            details.workshopTitle,
            workshopDate,
            status as WorkshopRegistrationStatus,
            notes || undefined
          )

          logger.info('Workshop status update email sent', {
            registrationId: id,
            userId: details.userId,
            newStatus: status
          })
        }
      } catch (emailError) {
        logger.error('Failed to send workshop status update email', { error: emailError })
      }
    }

    return apiSuccess({
      message: 'Registration updated successfully'
    })

  } catch (error) {
    logger.error('Error updating workshop registration', { error })
    return apiError(error, 'Failed to update registration')
  }
})
