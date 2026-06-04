import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { validateBody, validateQuery, CreateAppointmentSchema, GetAppointmentsQuerySchema } from '@/lib/schemas'
import { sendCustomEmail, appointmentUnassignedAlert } from '@/lib/email'
import { REVAMPIT_NOTIFICATION_EMAIL, URGENCY_DEFAULT } from '@/config/it-hilfe'
import { BOOKING_STATUS } from '@/config/booking-status'
import { ROLES } from '@/lib/constants'
import { APP_URL } from '@/config/urls'
import { ROUTES } from '@/config/routes'
import { TABLE_NAMES } from '@/config/database'
import { listAppointments, notifyRepairerOfAssignment } from '@/lib/services/appointments'
import { notifyAllStaff } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

// GET /api/appointments - Get appointments for current user (as customer or repairer)
export const GET = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const { searchParams } = new URL(request.url)
    const queryValidation = validateQuery(GetAppointmentsQuerySchema, {
      role: searchParams.get('role'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    })
    if (!queryValidation.success) return queryValidation.error
    const { role, status, limit, offset } = queryValidation.data

    // User scope: customer sees rows they booked; repairer sees rows assigned
    // to them. Admin listing lives at /api/admin/appointments and uses the
    // same listAppointments helper without a user filter.
    const data = await listAppointments({
      ...(role === ROLES.REPAIRER
        ? { repairerId: session.user.id }
        : { customerId: session.user.id }),
      status: status || undefined,
      limit,
      offset,
    })

    logger.info('Appointments fetched', {
      userId: session.user.id,
      role,
      count: data.appointments.length,
    })

    return apiSuccess(data)
  } catch (error) {
    logger.error('Error fetching appointments', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

// POST /api/appointments - Create a new service appointment
export const POST = withAuth(async (
  request: NextRequest,
  session: ValidSession
) => {
  try {
    const body = await request.json()
    const validation = validateBody(CreateAppointmentSchema, body)
    if (!validation.success) return validation.error
    const {
      repairer_id,
      repairer_profile_id,
      service_type_id: rawServiceTypeId,
      serviceSlug,
      description,
      device_info,
      preferred_date: rawPreferredDate,
      preferredDate: camelPreferredDate,
      urgency,
      is_home_visit,
      visit_address,
      visit_city,
    } = validation.data

    // Normalize field names (accept both snake_case and camelCase)
    const preferred_date = rawPreferredDate || camelPreferredDate || null

    // Resolve service_type_id from serviceSlug if needed
    let service_type_id = rawServiceTypeId
    if (!service_type_id && serviceSlug) {
      const [serviceRow] = await db
        .select({ id: serviceTypes.id })
        .from(serviceTypes)
        .where(eq(serviceTypes.slug, serviceSlug))
        .limit(1)
      if (serviceRow) {
        service_type_id = serviceRow.id
      }
    }

    // If still no service_type_id, insert without it using raw SQL
    // since the Drizzle schema has it as notNull but the DB allows null
    if (!service_type_id) {
      const result = await db.execute(sql`
        INSERT INTO ${sql.raw(TABLE_NAMES.SERVICE_APPOINTMENTS)} (user_id, description, status, urgency, is_home_visit,
          repairer_id, repairer_profile_id, device_info, preferred_date, visit_address, visit_city)
        VALUES (${session.user.id}, ${description}, ${BOOKING_STATUS.REQUESTED},
          ${urgency || URGENCY_DEFAULT}, ${is_home_visit || false},
          ${repairer_id || null}, ${repairer_profile_id || null},
          ${device_info || null}, ${preferred_date || null},
          ${visit_address || null}, ${visit_city || null})
        RETURNING *
      `)
      const createdAppointment = result.rows[0] as Record<string, unknown> | undefined

      notifyAdminsOfNewBooking(
        createdAppointment?.id as string | undefined,
        session,
        description,
        urgency,
        repairer_id,
      )
      if (repairer_id && createdAppointment?.id) {
        notifyRepairerOfAssignment(repairer_id, createdAppointment.id as string, description).catch(() => {})
      }

      return apiSuccess({ message: 'Termin erfolgreich erstellt', appointment: createdAppointment }, 201)
    }

    const [createdAppointment] = await db
      .insert(serviceAppointments)
      .values({
        userId: session.user.id,
        serviceTypeId: service_type_id,
        description,
        status: BOOKING_STATUS.REQUESTED,
        urgency: urgency || URGENCY_DEFAULT,
        isHomeVisit: is_home_visit || false,
        repairerId: repairer_id || undefined,
        repairerProfileId: repairer_profile_id || undefined,
        deviceInfo: device_info || undefined,
        preferredDate: preferred_date || undefined,
        visitAddress: visit_address || undefined,
        visitCity: visit_city || undefined,
      })
      .returning()

    logger.info('Appointment created', {
      appointmentId: createdAppointment?.id,
      userId: session.user.id,
      repairerId: repairer_id,
    })

    notifyAdminsOfNewBooking(createdAppointment?.id, session, description, urgency, repairer_id)
    if (repairer_id && createdAppointment?.id) {
      notifyRepairerOfAssignment(repairer_id, createdAppointment.id, description).catch(() => {})
    }

    return apiSuccess({
      message: 'Termin erfolgreich erstellt',
      appointment: createdAppointment,
    }, 201)

  } catch (error) {
    logger.error('Error creating appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})

/**
 * Fire-and-forget admin notification for a new booking.
 *
 * Two channels:
 *   1. In-app via notifyAllStaff — surfaces in the admin NotificationBell
 *      regardless of whether the booking was pre-assigned. This is the
 *      fix for the pre-existing gap where admins only learned about
 *      bookings by email.
 *   2. Email fallback via appointmentUnassignedAlert — only when no
 *      repairer was pre-assigned. Same behavior as before; just now
 *      links to the new /admin/appointments page (ROUTES SSOT) instead
 *      of /admin/services (which is the service catalog, not bookings).
 */
function notifyAdminsOfNewBooking(
  appointmentId: string | undefined,
  session: ValidSession,
  description: string,
  urgency: string | undefined,
  repairerId: string | null | undefined,
) {
  if (!appointmentId) return

  notifyAllStaff({
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Neuer Termin angefragt',
    content: `${session.user.name || session.user.email} hat einen Termin angefragt: ${description?.slice(0, 100)}`,
    related_type: RELATED_TYPES.APPOINTMENT,
    related_id: appointmentId,
  }).catch(() => {})

  if (!repairerId) {
    const emailContent = appointmentUnassignedAlert(
      'Admin',
      session.user.name || 'Kunde',
      'Reparatur',
      description,
      urgency || URGENCY_DEFAULT,
      APP_URL + ROUTES.admin.appointments,
    )
    // sendCustomEmail resolves { success: false } on failure rather than
    // throw — catch both modes per the documented swallow pattern.
    sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, emailContent)
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send unassigned booking alert (resolved)', { error: r.error, appointmentId })
        }
      })
      .catch(err => logger.warn('Failed to send unassigned booking alert (rejected)', { error: err, appointmentId }))
  }
}
