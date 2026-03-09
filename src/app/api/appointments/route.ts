import { NextRequest } from 'next/server'
import { db } from '@/db'
import { serviceAppointments, serviceTypes, users, repairerProfiles } from '@/db/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { validateBody, validateQuery, CreateAppointmentSchema, GetAppointmentsQuerySchema } from '@/lib/schemas'
import { sendCustomEmail, appointmentUnassignedAlert } from '@/lib/email'
import { REVAMPIT_NOTIFICATION_EMAIL } from '@/config/it-hilfe'
import { BOOKING_STATUS } from '@/config/booking-status'

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

    if (role === 'repairer') {
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

    // If still no service_type_id, we need one (it's required by schema FK)
    // Fall back to raw insert if no service type found
    if (!service_type_id) {
      // Use raw SQL for the insert when no service_type_id is available
      // since the Drizzle schema has it as notNull
      const fields = ['user_id', 'description', 'status', 'urgency', 'is_home_visit']
      const values: (string | boolean | null)[] = [
        session.user.id, description, BOOKING_STATUS.REQUESTED,
        urgency || 'normal', is_home_visit || false
      ]
      let paramIndex = values.length + 1

      if (repairer_id) { fields.push('repairer_id'); values.push(repairer_id); }
      if (repairer_profile_id) { fields.push('repairer_profile_id'); values.push(repairer_profile_id); }
      if (device_info) { fields.push('device_info'); values.push(device_info); }
      if (preferred_date) { fields.push('preferred_date'); values.push(preferred_date); }
      if (visit_address) { fields.push('visit_address'); values.push(visit_address); }
      if (visit_city) { fields.push('visit_city'); values.push(visit_city); }

      const placeholders = values.map((_, i) => `$${i + 1}`)
      const result = await query<{ id: string }>(
        `INSERT INTO ${TABLE_NAMES.SERVICE_APPOINTMENTS} (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        values
      )

      const createdAppointment = result.rows[0]
      notifyUnassigned(repairer_id, createdAppointment?.id, session, description, urgency)

      return apiSuccess({ message: 'Termin erfolgreich erstellt', appointment: createdAppointment }, 201)
    }

    const [createdAppointment] = await db
      .insert(serviceAppointments)
      .values({
        userId: session.user.id,
        serviceTypeId: service_type_id,
        description,
        status: BOOKING_STATUS.REQUESTED,
        urgency: urgency || 'normal',
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
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://revamp-it.ch'
    const emailContent = appointmentUnassignedAlert(
      'Admin',
      session.user.name || 'Kunde',
      'Reparatur',
      description,
      urgency || 'normal',
      baseUrl + '/admin/services'
    )
    sendCustomEmail(REVAMPIT_NOTIFICATION_EMAIL, emailContent).catch(err => {
      logger.warn('Failed to send unassigned booking alert', { error: err, appointmentId })
    })
  }
}
