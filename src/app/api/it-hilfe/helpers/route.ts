/**
 * IT-Hilfe Helpers API
 * GET /api/it-hilfe/helpers - Browse available helpers
 */

import { NextRequest } from 'next/server'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

interface HelperRow {
  user_id: string
  user_name: string
  user_email: string
  bio: string | null
  hourly_rate_cents: number | null
  accepts_gratis: boolean
  accepts_kulturlegi: boolean
  service_types: string[] | null
  location_postal_code: string | null
  location_city: string | null
  location_canton: string | null
  max_travel_km: number
  skills: string[] | null
  skill_count: number
}

interface CountRow {
  total: string
}

/**
 * GET /api/it-hilfe/helpers
 * Browse available IT helpers with filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const skill = searchParams.get('skill')
    const canton = searchParams.get('canton')
    const postalCode = searchParams.get('postalCode')
    const acceptsGratis = searchParams.get('acceptsGratis') === 'true'
    const acceptsKulturlegi = searchParams.get('acceptsKulturlegi') === 'true'
    const serviceType = searchParams.get('serviceType')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build WHERE conditions
    const conditions: string[] = ['hp.is_active = true']
    const params: (string | number | boolean)[] = []
    let paramIndex = 1

    if (skill) {
      conditions.push(`EXISTS (
        SELECT 1 FROM ${TABLE_NAMES.USER_SKILLS} us
        WHERE us.user_id = hp.user_id AND us.skill_id = $${paramIndex}
      )`)
      params.push(skill)
      paramIndex++
    }

    if (canton) {
      conditions.push(`hp.location_canton = $${paramIndex}`)
      params.push(canton)
      paramIndex++
    }

    if (postalCode) {
      conditions.push(`hp.location_postal_code = $${paramIndex}`)
      params.push(postalCode)
      paramIndex++
    }

    if (acceptsGratis) {
      conditions.push(`hp.accepts_gratis = true`)
    }

    if (acceptsKulturlegi) {
      conditions.push(`hp.accepts_kulturlegi = true`)
    }

    if (serviceType) {
      conditions.push(`$${paramIndex} = ANY(hp.service_types)`)
      params.push(serviceType)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Query helpers with their skills
    const helpersResult = await query(
      `
      SELECT
        hp.user_id,
        u.name as user_name,
        u.email as user_email,
        hp.bio,
        hp.hourly_rate_cents,
        hp.accepts_gratis,
        hp.accepts_kulturlegi,
        hp.service_types,
        hp.location_postal_code,
        hp.location_city,
        hp.location_canton,
        hp.max_travel_km,
        ARRAY_AGG(us.skill_id) FILTER (WHERE us.skill_id IS NOT NULL) as skills,
        COUNT(us.skill_id) as skill_count
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} hp
      JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      LEFT JOIN ${TABLE_NAMES.USER_SKILLS} us ON hp.user_id = us.user_id
      ${whereClause}
      GROUP BY hp.user_id, u.name, u.email, hp.bio, hp.hourly_rate_cents,
               hp.accepts_gratis, hp.accepts_kulturlegi, hp.service_types,
               hp.location_postal_code, hp.location_city, hp.location_canton,
               hp.max_travel_km
      ORDER BY skill_count DESC, u.name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `,
      [...params, limit, offset]
    )

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(DISTINCT hp.user_id) as total
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} hp
      LEFT JOIN ${TABLE_NAMES.USER_SKILLS} us ON hp.user_id = us.user_id
      ${whereClause}
    `,
      params
    )

    const helpers = (helpersResult.rows as HelperRow[]).map((row) => ({
      userId: row.user_id,
      name: row.user_name,
      // Only expose email to authenticated users
      bio: row.bio,
      hourlyRateCents: row.hourly_rate_cents,
      acceptsGratis: row.accepts_gratis,
      acceptsKulturlegi: row.accepts_kulturlegi,
      serviceTypes: row.service_types || [],
      postalCode: row.location_postal_code,
      city: row.location_city,
      canton: row.location_canton,
      maxTravelKm: row.max_travel_km,
      skills: row.skills || [],
    }))

    const countData = countResult.rows[0] as CountRow
    const total = parseInt(countData.total)

    logger.info('Fetched IT helpers', {
      count: helpers.length,
      total,
      filters: { skill, canton, postalCode, serviceType },
    })

    return apiSuccess({
      helpers,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    logger.error('Error fetching IT helpers', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
