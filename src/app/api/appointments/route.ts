import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, APPOINTMENT_ROLES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody, validateQuery, CreateAppointmentSchema, GetAppointmentsQuerySchema } from '@/lib/schemas'
import { sendCustomEmail, appointmentUnassignedAlert } from '@/lib/email'
import { REVAMPIT_NOTIFICATION_EMAIL } from '@/config/it-hilfe'

interface AppointmentRow {
  id: string
  user_id: string
  repairer_id: string
  repairer_profile_id: string
  service_type_id: string
  description: string
  device_info: string | null
  preferred_date: string | null
  confirmed_date: string | null
  urgency: string
  status: string
  is_home_visit: boolean
  visit_address: string | null
  visit_city: string | null
  quoted_price_chf: number | null
  created_at: string
  updated_at: string
  customer_name: string
  customer_email: string
  repairer_name: string
  business_name: string | null
  service_name: string
}

interface CountRow {
  total: number
}

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

    let whereClause: string
    const params: (string | number)[] = [session.user.id]

    if (role === APPOINTMENT_ROLES.REPAIRER) {
      whereClause = 'sa.repairer_id = $1'
    } else {
      whereClause = 'sa.user_id = $1'
    }

    if (status) {
      params.push(status)
      whereClause += ' AND sa.status = $' + params.length
    }

    const countParams = [...params]
    params.push(limit)
    params.push(offset)

    const result = await query(
      'SELECT sa.id, sa.user_id, sa.repairer_id, sa.repairer_profile_id, ' +
      'sa.service_type_id, sa.description, sa.device_info, sa.preferred_date, ' +
      'sa.confirmed_date, sa.urgency, sa.status, sa.is_home_visit, sa.visit_address, ' +
      'sa.visit_city, sa.quoted_price_chf, sa.diagnosis_notes, sa.completion_notes, ' +
      'sa.customer_rating, sa.created_at, sa.updated_at, c.name as customer_name, ' +
      'c.email as customer_email, r.name as repairer_name, rp.business_name, ' +
      'st.name as service_name ' +
      'FROM ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' sa ' +
      'LEFT JOIN ' + TABLE_NAMES.USERS + ' c ON sa.user_id = c.id ' +
      'LEFT JOIN ' + TABLE_NAMES.USERS + ' r ON sa.repairer_id = r.id ' +
      'LEFT JOIN ' + TABLE_NAMES.REPAIRER_PROFILES + ' rp ON sa.repairer_profile_id = rp.id ' +
      'LEFT JOIN ' + TABLE_NAMES.SERVICE_TYPES + ' st ON sa.service_type_id = st.id ' +
      'WHERE ' + whereClause + ' ' +
      'ORDER BY sa.created_at DESC ' +
      'LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length,
      params
    )

    const countResult = await query(
      'SELECT COUNT(*)::int as total FROM ' + TABLE_NAMES.SERVICE_APPOINTMENTS + ' sa WHERE ' + whereClause,
      countParams
    )

    const appointments = result.rows as AppointmentRow[]
    const countRows = countResult.rows as CountRow[]
    const total = countRows[0]?.total || 0

    logger.info('Appointments fetched', {
      userId: session.user.id,
      role,
      count: appointments.length
    })

    return apiSuccess({
      appointments,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + appointments.length < total
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
      const serviceResult = await query(
        `SELECT id FROM ${TABLE_NAMES.SERVICE_TYPES} WHERE slug = $1 LIMIT 1`,
        [serviceSlug]
      )
      if (serviceResult.rows.length > 0) {
        service_type_id = (serviceResult.rows[0] as { id: string }).id
      }
    }

    // Build insert query
    const fields = [
      'user_id', 'description', 'status', 'urgency',
      'is_home_visit', 'created_at', 'updated_at'
    ]
    const values = [
      session.user.id,
      description,
      'requested',
      urgency || 'normal',
      is_home_visit || false,
      'NOW()',
      'NOW()',
    ]
    const placeholders = [
      '$1', '$2', '$3', '$4', '$5', 'NOW()', 'NOW()'
    ]
    let paramIndex = 6

    // Optional fields
    if (repairer_id) {
      fields.push('repairer_id')
      placeholders.push(`$${paramIndex}`)
      values.push(repairer_id)
      paramIndex++
    }
    if (repairer_profile_id) {
      fields.push('repairer_profile_id')
      placeholders.push(`$${paramIndex}`)
      values.push(repairer_profile_id)
      paramIndex++
    }
    if (service_type_id) {
      fields.push('service_type_id')
      placeholders.push(`$${paramIndex}`)
      values.push(service_type_id)
      paramIndex++
    }
    if (device_info) {
      fields.push('device_info')
      placeholders.push(`$${paramIndex}`)
      values.push(device_info)
      paramIndex++
    }
    if (preferred_date) {
      fields.push('preferred_date')
      placeholders.push(`$${paramIndex}`)
      values.push(preferred_date)
      paramIndex++
    }
    if (visit_address) {
      fields.push('visit_address')
      placeholders.push(`$${paramIndex}`)
      values.push(visit_address)
      paramIndex++
    }
    if (visit_city) {
      fields.push('visit_city')
      placeholders.push(`$${paramIndex}`)
      values.push(visit_city)
      paramIndex++
    }

    // Remove NOW() from values since they're SQL expressions
    const actualParams = values.filter(v => v !== 'NOW()')
    const actualPlaceholders = fields.map((field, i) => {
      if (field === 'created_at' || field === 'updated_at') return 'NOW()'
      return placeholders[i]
    })

    const insertQuery = `INSERT INTO ${TABLE_NAMES.SERVICE_APPOINTMENTS} (${fields.join(', ')}) VALUES (${actualPlaceholders.join(', ')}) RETURNING *`

    const result = await query<{ id: string }>(insertQuery, actualParams)

    const createdAppointment = result.rows[0]

    logger.info('Appointment created', {
      appointmentId: createdAppointment?.id,
      userId: session.user.id,
      repairerId: repairer_id,
    })

    // If no repairer assigned, alert admin
    if (!repairer_id && createdAppointment?.id) {
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
        logger.warn('Failed to send unassigned booking alert', { error: err, appointmentId: createdAppointment.id })
      })
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
