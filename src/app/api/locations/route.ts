import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { QueryParams } from '@/lib/api/query-builder'
import { CountRow } from '@/lib/api/db-types'

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

    // Build query conditions — DB uses is_approved boolean, map status param
    const qb = new QueryParams()
    if (status === 'approved') {
      qb.add('is_approved = $P', 'true')
    } else if (status === 'pending') {
      qb.add('is_approved = $P', 'false')
    }

    if (type) {
      qb.add('type = $P', type)
    }

    if (city) {
      qb.add('city ILIKE $P', `%${city}%`)
    }

    const { where: whereClause, params, nextIndex } = qb.build()

    // Get locations
    const locationsQuery = `
      SELECT l.*
      FROM ${TABLE_NAMES.LOCATIONS} l
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT $${nextIndex} OFFSET $${nextIndex + 1}
    `

    const locations = await query(locationsQuery, [...params, String(limit), String(offset)])

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.LOCATIONS} l
      ${whereClause}
    `
    const countResult = await query(countQuery, params)
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
    `, [city, postal_code, name])

    if (existingLocation.rows.length > 0) {
      return apiBadRequest('Ein ähnlicher Ort existiert bereits in dieser Gegend')
    }

    // Create location
    const locationResult = await query(`
      INSERT INTO ${TABLE_NAMES.LOCATIONS} (
        name, type, description, address_line1, address_line2, postal_code,
        city, canton, country, latitude, longitude, max_capacity, facilities,
        contact_name, contact_phone, contact_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `, [
      name, type, description, address_line1, address_line2, postal_code,
      city, canton, country, latitude, longitude, max_capacity, facilities,
      contact_name, contact_phone, contact_email,
    ])

    return apiSuccess({
      location: locationResult.rows[0],
      message: 'Ort erfolgreich erstellt und zur Genehmigung eingereicht'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}