import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { CountRow } from '@/lib/api/db-types'

// GET /api/admin/it-hilfe/helpers - List all helper profiles
export const GET = withAdmin('it-hilfe-admin', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const canton = searchParams.get('canton')
    const skill = searchParams.get('skill')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conditions: string[] = []
    const params: (string | number)[] = []

    if (status === 'active') {
      conditions.push(`hp.is_active = true AND hp.suspended_at IS NULL`)
    } else if (status === 'verified') {
      conditions.push(`hp.is_verified = true`)
    } else if (status === 'suspended') {
      conditions.push(`hp.suspended_at IS NOT NULL`)
    }

    if (canton) {
      conditions.push(`hp.location_canton = $${conditions.length + 1}`)
      params.push(canton)
    }

    if (skill) {
      conditions.push(`EXISTS (SELECT 1 FROM ${TABLE_NAMES.USER_SKILLS} us WHERE us.user_id = hp.user_id AND us.skill_id = $${conditions.length + 1})`)
      params.push(skill)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    const helpersQuery = `
      SELECT
        hp.id, hp.user_id, hp.bio, hp.hourly_rate_cents,
        hp.accepts_gratis, hp.accepts_kulturlegi, hp.service_types,
        hp.location_city, hp.location_canton, hp.is_active,
        hp.is_verified, hp.verified_at, hp.suspended_at, hp.admin_notes,
        hp.total_helps_completed, hp.average_rating,
        hp.created_at,
        u.name as helper_name, u.email as helper_email,
        (SELECT array_agg(us.skill_id)
         FROM ${TABLE_NAMES.USER_SKILLS} us
         WHERE us.user_id = hp.user_id) as skills
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} hp
      JOIN ${TABLE_NAMES.USERS} u ON hp.user_id = u.id
      ${whereClause}
      ORDER BY hp.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    params.push(limit, offset)
    const helpers = await query(helpersQuery, params)

    const countParams = params.slice(0, -2)
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} hp
      ${whereClause}
    `
    const countResult = await query(countQuery, countParams)
    const count = countResult.rows[0] as CountRow

    return apiSuccess({
      items: helpers.rows,
      pagination: {
        total: parseInt(count.total),
        limit,
        offset,
        hasMore: offset + limit < parseInt(count.total),
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
