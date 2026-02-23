import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'


interface CountRow {
  total: string
}

// GET /api/locations - List locations with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const city = searchParams.get('city')
    const status = searchParams.get('status') || 'approved'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query conditions
    const conditions = ['approval_status = $1']
    const params = [status]
    let paramIndex = 2

    if (type) {
      conditions.push(`type = $${paramIndex}`)
      params.push(type)
      paramIndex++
    }

    if (city) {
      conditions.push(`city ILIKE $${paramIndex}`)
      params.push(`%${city}%`)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Get locations
    const locationsQuery = `
      SELECT
        l.*,
        u.name as creator_name,
        u.email as creator_email,
        COUNT(lb.id) as active_bookings
      FROM ${TABLE_NAMES.LOCATIONS} l
      LEFT JOIN ${TABLE_NAMES.USERS} u ON l.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.LOCATION_BOOKINGS} lb ON l.id = lb.location_id
        AND lb.status IN ('pending', 'confirmed')
        AND lb.start_time > CURRENT_TIMESTAMP
      ${whereClause}
      GROUP BY l.id, u.name, u.email
      ORDER BY l.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(String(limit), String(offset))

    const locations = await query(locationsQuery, params)

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.LOCATIONS} l
      ${whereClause.replace('$1', `$${params.indexOf(status) + 1}`)}
    `
    const countParams = params.slice(0, -2) // Remove limit and offset
    const countResult = await query(countQuery, countParams)
    const totalCount = parseInt((countResult.rows[0] as CountRow).total)

    return apiSuccess({
      locations: locations.rows,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}

// POST /api/locations - Create new location
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const body = await request.json()
    const {
      name,
      type,
      description,
      address_line1,
      address_line2,
      postal_code,
      city,
      canton,
      country = 'Switzerland',
      latitude,
      longitude,
      max_capacity,
      facilities = [],
      accessibility_info = {},
      contact_name,
      contact_phone,
      contact_email
    } = body

    // Validate required fields
    if (!name || !type || !city) {
      return apiBadRequest(ERROR_MESSAGES.ALL_FIELDS_REQUIRED)
    }

    // Validate Swiss postal code if provided
    if (postal_code && !/^[0-9]{4}$/.test(postal_code)) {
      return apiBadRequest('Ungültige Schweizer Postleitzahl')
    }

    // Validate coordinates if provided
    if ((latitude && !longitude) || (!latitude && longitude)) {
      return apiBadRequest('Beide Koordinaten (Breitengrad und Längengrad) müssen angegeben werden')
    }

    if (latitude && (latitude < -90 || latitude > 90)) {
      return apiBadRequest('Ungültiger Breitengrad')
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      return apiBadRequest('Ungültiger Längengrad')
    }

    // Check for duplicate locations in same area
    const existingLocation = await query(`
      SELECT id FROM ${TABLE_NAMES.LOCATIONS}
      WHERE city = $1 AND postal_code = $2 AND name ILIKE $3
        AND approval_status IN ('pending', 'approved')
    `, [city, postal_code, name])

    if (existingLocation.rows.length > 0) {
      return apiBadRequest('Ein ähnlicher Ort existiert bereits in dieser Gegend')
    }

    // Create location
    const locationResult = await query(`
      INSERT INTO ${TABLE_NAMES.LOCATIONS} (
        name, type, description, address_line1, address_line2, postal_code,
        city, canton, country, latitude, longitude, max_capacity, facilities,
        accessibility_info, contact_name, contact_phone, contact_email, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `, [
      name, type, description, address_line1, address_line2, postal_code,
      city, canton, country, latitude, longitude, max_capacity, facilities,
      JSON.stringify(accessibility_info), contact_name, contact_phone, contact_email, session.user.id
    ])

    return apiSuccess({
      location: locationResult.rows[0],
      message: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}