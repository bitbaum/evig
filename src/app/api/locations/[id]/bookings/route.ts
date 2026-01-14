import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { getUserRole } from '@/lib/api/role-checks'

interface LocationStatusRow {
  id: string
  approval_status: string
}

interface LocationCapacityRow {
  id: string
  approval_status: string
  max_capacity: number | null
}

interface BookingConflictRow {
  id: string
  title: string
  start_time: string
  end_time: string
}

// GET /api/locations/[id]/bookings - Get location bookings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Verify location exists and is approved
    const locationCheck = await query(`
      SELECT id, approval_status FROM ${TABLE_NAMES.LOCATIONS}
      WHERE id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const locationStatus = locationCheck.rows[0] as LocationStatusRow
    if (locationStatus.approval_status !== 'approved') {
      return apiForbidden('Ort ist nicht zur Buchung freigegeben')
    }

    // Build query
    const conditions = ['lb.location_id = $1']
    const params = [locationId]
    let paramIndex = 2

    if (status) {
      conditions.push(`lb.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (startDate) {
      conditions.push(`lb.start_time >= $${paramIndex}`)
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      conditions.push(`lb.end_time <= $${paramIndex}`)
      params.push(endDate)
      paramIndex++
    }

    const whereClause = conditions.join(' AND ')

    const bookingsQuery = `
      SELECT
        lb.*,
        u.name as booked_by_name,
        u.email as booked_by_email,
        l.name as location_name
      FROM ${TABLE_NAMES.LOCATION_BOOKINGS} lb
      LEFT JOIN ${TABLE_NAMES.USERS} u ON lb.booked_by = u.id
      LEFT JOIN ${TABLE_NAMES.LOCATIONS} l ON lb.location_id = l.id
      WHERE ${whereClause}
      ORDER BY lb.start_time ASC
    `

    const bookings = await query(bookingsQuery, params)

    return apiSuccess({
      bookings: bookings.rows,
      location: locationStatus
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// POST /api/locations/[id]/bookings - Create location booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }
    const body = await request.json()
    const {
      event_type,
      event_id,
      title,
      description,
      start_time,
      end_time,
      expected_attendees,
      special_requirements
    } = body

    // Validate required fields
    if (!event_type || !title || !start_time || !end_time) {
      return apiBadRequest(ERROR_MESSAGES.ALL_FIELDS_REQUIRED)
    }

    // Validate event type
    if (!['workshop', 'repair', 'meeting', 'other'].includes(event_type)) {
      return apiBadRequest('Ungültiger Veranstaltungstyp')
    }

    // Parse and validate dates
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return apiBadRequest('Ungültiges Datum/Uhrzeit Format')
    }

    if (startDate >= endDate) {
      return apiBadRequest('Endzeit muss nach Startzeit liegen')
    }

    if (startDate < new Date()) {
      return apiBadRequest('Buchungen können nicht in der Vergangenheit liegen')
    }

    // Check location exists and is approved
    const locationCheck = await query(`
      SELECT id, approval_status, max_capacity FROM ${TABLE_NAMES.LOCATIONS}
      WHERE id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = locationCheck.rows[0] as LocationCapacityRow
    if (location.approval_status !== 'approved') {
      return apiForbidden('Ort ist nicht zur Buchung freigegeben')
    }

    // Check capacity if specified
    if (expected_attendees && location.max_capacity && expected_attendees > location.max_capacity) {
      return apiBadRequest(`Maximale Kapazität (${location.max_capacity}) würde überschritten`)
    }

    // Check for booking conflicts
    const conflictCheck = await query(`
      SELECT id, title, start_time, end_time FROM ${TABLE_NAMES.LOCATION_BOOKINGS}
      WHERE location_id = $1
        AND status IN ('pending', 'confirmed')
        AND (
          (start_time <= $2 AND end_time > $2) OR
          (start_time < $3 AND end_time >= $3) OR
          (start_time >= $2 AND end_time <= $3)
        )
    `, [locationId, startDate.toISOString(), endDate.toISOString()])

    if (conflictCheck.rows.length > 0) {
      const conflict = conflictCheck.rows[0] as BookingConflictRow
      return apiBadRequest(
        `Zeitkonflikt mit bestehender Buchung: "${conflict.title}" (${conflict.start_time} - ${conflict.end_time})`
      )
    }

    // Create booking
    const bookingResult = await query(`
      INSERT INTO ${TABLE_NAMES.LOCATION_BOOKINGS} (
        location_id, booked_by, event_type, event_id, title, description,
        start_time, end_time, expected_attendees, special_requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      locationId, session.user.id, event_type, event_id || null, title, description,
      startDate.toISOString(), endDate.toISOString(), expected_attendees || null, special_requirements
    ])

    // Update location usage statistics
    await query(`
      UPDATE ${TABLE_NAMES.LOCATIONS}
      SET usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [locationId])

    return apiSuccess({
      booking: bookingResult.rows[0],
      message: 'Buchung erfolgreich erstellt'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}