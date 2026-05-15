import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, repairerProfiles } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
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
import { TABLE_NAMES } from '@/config/database'
import { notifyUsers } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

const customer = alias(users, 'customer')
const repairer = alias(users, 'repairer')

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

    const conditions = []

    if (role === ROLES.REPAIRER) {
      conditions.push(eq(serviceAppointments.repairerId, session.user.id))
    } else {
      conditions.push(eq(serviceAppointments.userId, session.user.id))
    }

    if (status) {
      conditions.push(eq(serviceAppointments.status, status))
    }

    const where = and(...conditions)

    const rows = await db
      .select({
        id: serviceAppointments.id,
        user_id: serviceAppointments.userId,
        repairer_id: serviceAppointments.repairerId,
        repairer_profile_id: serviceAppointments.repairerProfileId,
        service_type_id: serviceAppointments.serviceTypeId,
        description: serviceAppointments.description,
        device_info: serviceAppointments.deviceInfo,
        preferred_date: serviceAppointments.preferredDate,
        confirmed_date: serviceAppointments.confirmedDate,
        urgency: serviceAppointments.urgency,
        status: serviceAppointments.status,
        is_home_visit: serviceAppointments.isHomeVisit,
        visit_address: serviceAppointments.visitAddress,
        visit_city: serviceAppointments.visitCity,
        quoted_price_chf: serviceAppointments.quotedPriceChf,
        diagnosis_notes: serviceAppointments.diagnosisNotes,
        completion_notes: serviceAppointments.completionNotes,
        customer_rating: serviceAppointments.customerRating,
        created_at: serviceAppointments.createdAt,
        updated_at: serviceAppointments.updatedAt,
        customer_name: customer.name,
        customer_email: customer.email,
        repairer_name: repairer.name,
        business_name: repairerProfiles.businessName,
        service_name: serviceTypes.name,
      })
      .from(serviceAppointments)
      .leftJoin(customer, eq(serviceAppointments.userId, customer.id))
      .leftJoin(repairer, eq(serviceAppointments.repairerId, repairer.id))
      .leftJoin(repairerProfiles, eq(serviceAppointments.repairerProfileId, repairerProfiles.id))
      .leftJoin(serviceTypes, eq(serviceAppointments.serviceTypeId, serviceTypes.id))
      .where(where)
      .orderBy(desc(serviceAppointments.createdAt))
      .limit(limit)
      .offset(offset)

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(serviceAppointments)
      .where(where)

    const total = Number(countRow?.total ?? 0)

    logger.info('Appointments fetched', {
      userId: session.user.id,
      role,
      count: rows.length
    })

    return apiSuccess({
      appointments: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + rows.length < total
      }
    })

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

      notifyUnassigned(repairer_id, createdAppointment?.id as string | undefined, session, description, urgency)
      if (repairer_id && createdAppointment?.id) {
        notifyUsers([repairer_id], {
          type: NOTIFICATION_TYPES.SERVICE_APPOINTMENT_ASSIGNED,
          title: 'Neuer Termin zugewiesen',
          content: `Dir wurde ein neuer Reparaturtermin zugewiesen: ${description?.slice(0, 100)}`,
          related_type: RELATED_TYPES.APPOINTMENT,
          related_id: createdAppointment.id as string,
        }).catch(() => {})
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

    notifyUnassigned(repairer_id, createdAppointment?.id, session, description, urgency)
    if (repairer_id && createdAppointment?.id) {
      notifyUsers([repairer_id], {
        type: NOTIFICATION_TYPES.SERVICE_APPOINTMENT_ASSIGNED,
        title: 'Neuer Termin zugewiesen',
        content: `Dir wurde ein neuer Reparaturtermin zugewiesen: ${description?.slice(0, 100)}`,
        related_type: RELATED_TYPES.APPOINTMENT,
        related_id: createdAppointment.id,
      }).catch(() => {})
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

// Fire-and-forget alert if no repairer assigned
function notifyUnassigned(
  repairerId: string | null | undefined,
  appointmentId: string | undefined,
  session: ValidSession,
  description: string,
  urgency: string | undefined
) {
  if (!repairerId && appointmentId) {
    const baseUrl = APP_URL
    const emailContent = appointmentUnassignedAlert(
      'Admin',
      session.user.name || 'Kunde',
      'Reparatur',
      description,
      urgency || URGENCY_DEFAULT,
      baseUrl + '/admin/services'
    )
    sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, emailContent).catch(err => {
      logger.warn('Failed to send unassigned booking alert', { error: err, appointmentId })
    })
  }
}
