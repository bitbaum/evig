/**
 * POST /api/admin/appointments/[id]/assign
 *
 * Admin assigns a repairer to a service booking. Moves the booking from
 * `requested` to `accepted` so the repairer's queue surfaces it, and
 * notifies the assigned repairer in-app + via email.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { serviceAppointments, users, repairerProfiles } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { withAdmin } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { validateBody } from '@/lib/schemas'
import { uuidSchema } from '@/lib/schemas/common'
import { BOOKING_STATUS } from '@/config/booking-status'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TECHNICIAN_LABEL, technicianNotFoundMessage } from '@/config/terminology'
import { logger } from '@/lib/logger'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

const AssignBodySchema = z.object({
  repairer_id: uuidSchema,
})

export const POST = withAdmin<{ id: string }>('appointments-admin', async (
  request: NextRequest,
  _session,
  context,
) => {
  try {
    const appointmentId = context?.params?.id
    if (!appointmentId) return apiBadRequest('Termin-ID erforderlich')

    const body = await request.json()
    const validation = validateBody(AssignBodySchema, body)
    if (!validation.success) return validation.error
    const { repairer_id } = validation.data

    // Sanity-check the booking exists
    const [appointment] = await db
      .select({
        id: serviceAppointments.id,
        description: serviceAppointments.description,
        status: serviceAppointments.status,
      })
      .from(serviceAppointments)
      .where(eq(serviceAppointments.id, appointmentId))

    if (!appointment) return apiNotFound(ERROR_MESSAGES.APPOINTMENT_NOT_FOUND)

    // Sanity-check the repairer exists + is an active+verified repairer.
    const [repairerRow] = await db
      .select({ profileId: repairerProfiles.id, userId: users.id })
      .from(repairerProfiles)
      .innerJoin(users, eq(repairerProfiles.userId, users.id))
      .where(eq(repairerProfiles.userId, repairer_id))

    if (!repairerRow) return apiBadRequest(technicianNotFoundMessage() + ' oder nicht aktiv')

    // Assign + move into the repairer's active queue (accepted).
    await db
      .update(serviceAppointments)
      .set({
        repairerId: repairerRow.userId,
        repairerProfileId: repairerRow.profileId,
        status: BOOKING_STATUS.ACCEPTED,
        updatedAt: sql`NOW()`,
      })
      .where(eq(serviceAppointments.id, appointmentId))

    // Fire-and-forget notification to the assigned repairer.
    notifyUsers([repairerRow.userId], {
      type: NOTIFICATION_TYPES.SERVICE_APPOINTMENT_ASSIGNED,
      title: 'Neuer Termin zugewiesen',
      content: `Dir wurde ein Reparaturtermin zugewiesen: ${appointment.description?.slice(0, 100) || ''}`,
      related_type: RELATED_TYPES.APPOINTMENT,
      related_id: appointmentId,
    }).catch(() => {})

    logger.info('Appointment assigned by admin', {
      appointmentId,
      repairerId: repairerRow.userId,
    })

    return apiSuccess({ message: `${TECHNICIAN_LABEL} zugewiesen` })
  } catch (error) {
    logger.error('Error assigning appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
