import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest } from '@/lib/api/helpers'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, APPOINTMENT_ROLES } from '@/config/database'
import { logger } from '@/lib/logger'

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
    const role = searchParams.get('role') || APPOINTMENT_ROLES.CUSTOMER
    const status = searchParams.get('status')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

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
    const {
      repairer_id,
      repairer_profile_id,
      service_type_id,
      description,
      device_info,
      preferred_date,
      urgency,
      is_home_visit,
      visit_address,
      visit_city,
    } = body

    // Validate required fields
    if (!description) {
      return apiBadRequest('Beschreibung ist erforderlich')
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

    logger.info('Appointment created', {
      appointmentId: result.rows[0]?.id,
      userId: session.user.id,
      repairerId: repairer_id,
    })

    return apiSuccess({
      message: 'Termin erfolgreich erstellt',
      appointment: result.rows[0],
    }, 201)

  } catch (error) {
    logger.error('Error creating appointment', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
