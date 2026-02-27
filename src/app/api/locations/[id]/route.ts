import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountAsCountRow } from '@/lib/api/db-types'

interface LocationOwnerRow {
  created_by: string
  approval_status: string
}

// GET /api/locations/[id] - Get location details
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

    // Get location with creator and approval info
    const locationResult = await query(`
      SELECT
        l.*,
        u.name as creator_name,
        u.email as creator_email,
        ua.action as last_approval_action,
        ua.reviewed_at as last_reviewed_at,
        ua.review_notes as last_review_notes,
        COUNT(DISTINCT lb.id) as total_bookings,
        COUNT(DISTINCT CASE WHEN lb.start_time > CURRENT_TIMESTAMP AND lb.status IN ('pending', 'confirmed') THEN lb.id END) as upcoming_bookings
      FROM ${TABLE_NAMES.LOCATIONS} l
      LEFT JOIN ${TABLE_NAMES.USERS} u ON l.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.LOCATION_APPROVALS} ua ON l.id = ua.location_id
        AND ua.reviewed_at = (
          SELECT MAX(reviewed_at) FROM ${TABLE_NAMES.LOCATION_APPROVALS} WHERE location_id = l.id
        )
      LEFT JOIN ${TABLE_NAMES.LOCATION_BOOKINGS} lb ON l.id = lb.location_id
      WHERE l.id = $1
      GROUP BY l.id, u.name, u.email, ua.action, ua.reviewed_at, ua.review_notes
    `, [locationId])

    if (locationResult.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = locationResult.rows[0]

    // Get recent bookings
    const bookingsResult = await query(`
      SELECT
        lb.*,
        u.name as booked_by_name,
        u.email as booked_by_email
      FROM ${TABLE_NAMES.LOCATION_BOOKINGS} lb
      LEFT JOIN ${TABLE_NAMES.USERS} u ON lb.booked_by = u.id
      WHERE lb.location_id = $1 AND lb.start_time > CURRENT_TIMESTAMP
      ORDER BY lb.start_time ASC
      LIMIT 10
    `, [locationId])

    return apiSuccess({
      location,
      recentBookings: bookingsResult.rows
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// PUT /api/locations/[id] - Update location
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id: locationId } = await params
    const body = await request.json()

    // Check if user owns this location or is admin
    const ownershipCheck = await query(`
      SELECT created_by, approval_status FROM ${TABLE_NAMES.LOCATIONS}
      WHERE id = $1
    `, [locationId])

    if (ownershipCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = ownershipCheck.rows[0] as LocationOwnerRow
    const isOwner = location.created_by === session.user.id
    const isAdmin = session.user.isStaff

    if (!isOwner && !isAdmin) {
      return apiForbidden('Keine Berechtigung diesen Ort zu bearbeiten')
    }

    // Prevent editing approved locations unless admin
    if (location.approval_status === 'approved' && !isAdmin) {
      return apiForbidden('Genehmigte Orte können nur von Administratoren bearbeitet werden')
    }

    // Update location
    const updateFields = []
    const updateValues = []
    let paramIndex = 1

    const allowedFields = [
      'name', 'description', 'address_line1', 'address_line2', 'postal_code',
      'city', 'canton', 'country', 'latitude', 'longitude', 'max_capacity',
      'facilities', 'accessibility_info', 'contact_name', 'contact_phone', 'contact_email'
    ]

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramIndex}`)
        updateValues.push(key === 'accessibility_info' ? JSON.stringify(value) : value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return apiBadRequest('Keine gültigen Felder zum Aktualisieren')
    }

    updateValues.push(locationId)

    const updateQuery = `
      UPDATE ${TABLE_NAMES.LOCATIONS}
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const updateResult = await query(updateQuery, updateValues)

    return apiSuccess({
      location: updateResult.rows[0],
      message: 'Ort erfolgreich aktualisiert'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// DELETE /api/locations/[id] - Delete location
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id: locationId } = await params

    // Check ownership and permissions
    const locationCheck = await query(`
      SELECT created_by, approval_status FROM ${TABLE_NAMES.LOCATIONS}
      WHERE id = $1
    `, [locationId])

    if (locationCheck.rows.length === 0) {
      return apiNotFound('Ort nicht gefunden')
    }

    const location = locationCheck.rows[0] as LocationOwnerRow
    const isOwner = location.created_by === session.user.id
    const isAdmin = session.user.isStaff

    if (!isOwner && !isAdmin) {
      return apiForbidden('Keine Berechtigung diesen Ort zu löschen')
    }

    // Check for active bookings
    const activeBookings = await query(`
      SELECT COUNT(*) as count FROM ${TABLE_NAMES.LOCATION_BOOKINGS}
      WHERE location_id = $1 AND status IN ('pending', 'confirmed') AND start_time > CURRENT_TIMESTAMP
    `, [locationId])

    if (parseInt((activeBookings.rows[0] as CountAsCountRow).count) > 0) {
      return apiBadRequest('Ort kann nicht gelöscht werden, da aktive Buchungen existieren')
    }

    // Delete location
    await query(`DELETE FROM ${TABLE_NAMES.LOCATIONS} WHERE id = $1`, [locationId])

    return apiSuccess({
      message: 'Ort erfolgreich gelöscht'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}