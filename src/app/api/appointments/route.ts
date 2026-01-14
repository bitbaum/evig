import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiNotFound } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { TABLE_NAMES } from '@/config/database'

interface ServiceRow {
  id: string
  name: string
  requires_approval: boolean
}

interface AppointmentIdRow {
  id: string
  created_at: string
}

interface AppointmentRow {
  id: string
  user_id: string
  status: string
  description: string
  service_name: string
  service_slug: string
  duration_minutes: number
  price_cents: number
  created_at: Date
  updated_at: Date
  preferred_date: Date | null
  confirmed_date: Date | null
}

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { serviceSlug, description, urgency = 'normal' } = await request.json()

    if (!serviceSlug) {
      return apiBadRequest('Service-Slug erforderlich')
    }

    // Find the service type
    const services = await query(
      `SELECT id, name, requires_approval FROM ${TABLE_NAMES.SERVICE_TYPES} WHERE slug = $1`,
      [serviceSlug]
    )

    if (services.rows.length === 0) {
      return apiNotFound('Service')
    }

    const service = services.rows[0] as ServiceRow

    // Create the appointment
    const appointmentResult = await query(
      `INSERT INTO ${TABLE_NAMES.SERVICE_APPOINTMENTS} (user_id, service_type_id, description, urgency, status)
       VALUES ($1, $2, $3, $4, 'requested')
       RETURNING id, created_at`,
      [session.user.id, service.id, description || null, urgency]
    )

    const aptRow = appointmentResult.rows[0] as AppointmentIdRow
    return apiSuccess({
      message: service.requires_approval
        ? 'Terminanfrage eingereicht. Wir kontaktieren Sie bald für die Terminbestätigung.'
        : 'Termin erfolgreich gebucht!',
      appointmentId: aptRow.id,
      serviceName: service.name,
      requiresApproval: service.requires_approval
    })

  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
})

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    // Get user's appointments
    const appointments = await query(
      `SELECT
         sa.*,
         st.name as service_name,
         st.slug as service_slug,
         st.duration_minutes,
         st.price_cents
       FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} sa
       JOIN ${TABLE_NAMES.SERVICE_TYPES} st ON sa.service_type_id = st.id
       WHERE sa.user_id = $1
       ORDER BY sa.created_at DESC`,
      [session.user.id]
    )

    return apiSuccess({
      appointments: (appointments.rows as AppointmentRow[]).map(apt => ({
        ...apt,
        created_at: apt.created_at.toISOString(),
        preferred_date: apt.preferred_date?.toISOString() || null,
        confirmed_date: apt.confirmed_date?.toISOString() || null,
        updated_at: apt.updated_at.toISOString(),
      }))
    })

  } catch (error) {
    return apiError(error, 'Interner Serverfehler')
  }
})







