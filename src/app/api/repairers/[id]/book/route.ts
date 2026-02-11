import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { sendCustomEmail, appointmentNewBooking } from '@/lib/email'

interface RepairerRow {
  id: string
  user_id: string
  business_name: string | null
  status: string
  is_active: boolean
}

interface ServiceTypeRow {
  id: string
  name: string
  slug: string
  requires_approval: boolean
}

interface AppointmentRow {
  id: string
  created_at: string
}

// POST /api/repairers/[id]/book - Book an appointment with a specific repairer
export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: { id: string } }
) => {
  try {
    const repairerId = context?.params?.id
    if (!repairerId) {
      return apiBadRequest('Repairer ID erforderlich')
    }
    const body = await request.json()

    const {
      service_category,
      description,
      device_info,
      preferred_date,
      preferred_time,
      urgency = 'normal',
      is_home_visit = false,
      visit_address,
      visit_postal_code,
      visit_city
    } = body

    // Validate required fields
    if (!service_category) {
      return apiBadRequest('Service-Kategorie erforderlich')
    }

    if (!description) {
      return apiBadRequest('Beschreibung des Problems erforderlich')
    }

    // Verify repairer exists and is active
    const repairerResult = await query(`
      SELECT id, user_id, business_name, status, is_active
      FROM ${TABLE_NAMES.REPAIRER_PROFILES}
      WHERE id = $1
    `, [repairerId])

    if (repairerResult.rows.length === 0) {
      return apiNotFound('Reparateur nicht gefunden')
    }

    const repairer = repairerResult.rows[0] as RepairerRow

    if (!repairer.is_active || repairer.status !== 'active') {
      return apiBadRequest('Dieser Reparateur nimmt derzeit keine Aufträge an')
    }

    // Prevent booking with yourself
    if (repairer.user_id === session.user.id) {
      return apiBadRequest('Sie können keinen Termin bei sich selbst buchen')
    }

    // Find or create service type based on category
    let serviceTypeResult = await query(`
      SELECT id, name, slug, requires_approval
      FROM ${TABLE_NAMES.SERVICE_TYPES}
      WHERE slug = $1 AND is_active = true
    `, [service_category])

    let serviceType: ServiceTypeRow

    if (serviceTypeResult.rows.length === 0) {
      // Use a generic "repair" service type if specific category not found
      serviceTypeResult = await query(`
        SELECT id, name, slug, requires_approval
        FROM ${TABLE_NAMES.SERVICE_TYPES}
        WHERE slug = 'general_repair' AND is_active = true
        LIMIT 1
      `, [])

      if (serviceTypeResult.rows.length === 0) {
        // Create a generic service type if none exists
        const createServiceResult = await query(`
          INSERT INTO ${TABLE_NAMES.SERVICE_TYPES} (name, slug, description, requires_approval, is_active)
          VALUES ('Allgemeine Reparatur', 'general_repair', 'Allgemeine Reparaturdienstleistungen', true, true)
          ON CONFLICT (slug) DO UPDATE SET is_active = true
          RETURNING id, name, slug, requires_approval
        `, [])
        serviceType = createServiceResult.rows[0] as ServiceTypeRow
      } else {
        serviceType = serviceTypeResult.rows[0] as ServiceTypeRow
      }
    } else {
      serviceType = serviceTypeResult.rows[0] as ServiceTypeRow
    }

    // Start transaction
    await query('BEGIN')

    try {
      // Create the appointment
      const appointmentResult = await query(`
        INSERT INTO ${TABLE_NAMES.SERVICE_APPOINTMENTS} (
          user_id,
          service_type_id,
          repairer_id,
          repairer_profile_id,
          description,
          device_info,
          preferred_date,
          urgency,
          status,
          is_home_visit,
          visit_address,
          visit_postal_code,
          visit_city
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'requested', $9, $10, $11, $12)
        RETURNING id, created_at
      `, [
        session.user.id,
        serviceType.id,
        repairer.user_id,
        repairer.id,
        description,
        device_info || null,
        preferred_date ? new Date(preferred_date + (preferred_time ? 'T' + preferred_time : 'T09:00:00')) : null,
        urgency,
        is_home_visit,
        is_home_visit ? visit_address : null,
        is_home_visit ? visit_postal_code : null,
        is_home_visit ? visit_city : null
      ])

      const appointment = appointmentResult.rows[0] as AppointmentRow

      // If a specific time slot was selected, mark it as booked
      if (preferred_date && preferred_time) {
        await query(`
          UPDATE ${TABLE_NAMES.REPAIRER_AVAILABILITY}
          SET availability_type = 'booked', booking_id = $1, updated_at = CURRENT_TIMESTAMP
          WHERE repairer_id = $2
            AND date = $3::date
            AND start_time = $4::time
            AND availability_type = 'available'
        `, [appointment.id, repairerId, preferred_date, preferred_time + ':00'])
      }

      await query('COMMIT')

      // Fire-and-forget: notify repairer by email
      const repairerUserResult = await query(
        `SELECT email, name FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
        [repairer.user_id]
      )
      if (repairerUserResult.rows.length > 0) {
        const repairerUser = repairerUserResult.rows[0] as { email: string; name: string | null }
        const appointmentUrl = `${process.env.NEXT_PUBLIC_URL || 'https://revamp-it.ch'}/dashboard/repairer/bookings`
        const emailContent = appointmentNewBooking(
          repairerUser.name || repairer.business_name || 'Reparateur',
          session.user.name || 'Kunde',
          serviceType.name,
          description,
          appointmentUrl
        )
        sendCustomEmail(repairerUser.email, emailContent).catch(err => {
          logger.warn('Failed to send new booking email to repairer', { error: err, appointmentId: appointment.id })
        })
      }

      logger.info('Appointment booked with repairer', {
        appointmentId: appointment.id,
        repairerId,
        customerId: session.user.id,
        serviceCategory: service_category
      })

      return apiSuccess({
        message: 'Ihre Anfrage wurde erfolgreich gesendet. Der Reparateur wird sich in Kürze bei Ihnen melden.',
        appointment: {
          id: appointment.id,
          created_at: appointment.created_at,
          repairer_name: repairer.business_name,
          service_name: serviceType.name,
          status: 'requested',
          preferred_date: preferred_date || null
        }
      })

    } catch (txError) {
      await query('ROLLBACK')
      throw txError
    }

  } catch (error) {
    logger.error('Error booking appointment with repairer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
