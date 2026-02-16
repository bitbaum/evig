/**
 * API: Activity Updates
 *
 * GET  /api/admin/team/activity/updates - List activity updates
 * POST /api/admin/team/activity/updates - Create activity update
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { canAccessSection } from '@/lib/permissions'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiForbidden,
  apiBadRequest,
} from '@/lib/api/helpers'
import {
  validateCreateActivityUpdate,
  activityStreamFilterSchema,
} from '@/lib/schemas/activity'

interface ActivityUpdate {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  update_type: string
  title: string
  description: string | null
  category: string | null
  visibility: string
  occurred_at: string
  created_at: string
  updated_at: string
}

/**
 * GET /api/admin/team/activity/updates
 * List activity updates with optional filters
 */
export const GET = withAdmin(async (request, session) => {
  try {
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filterResult = activityStreamFilterSchema.safeParse({
      user_id: searchParams.get('user_id') || undefined,
      category: searchParams.get('category') || undefined,
      since: searchParams.get('since') || undefined,
      until: searchParams.get('until') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data
    const conditions: string[] = []
    const values: (string | number)[] = []
    let paramIndex = 1

    if (filters.user_id) {
      conditions.push(`au.user_id = $${paramIndex}`)
      values.push(filters.user_id)
      paramIndex++
    }

    if (filters.category) {
      conditions.push(`au.category = $${paramIndex}`)
      values.push(filters.category)
      paramIndex++
    }

    if (filters.since) {
      conditions.push(`au.occurred_at >= $${paramIndex}`)
      values.push(filters.since)
      paramIndex++
    }

    if (filters.until) {
      conditions.push(`au.occurred_at <= $${paramIndex}`)
      values.push(filters.until)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Add pagination params
    values.push(filters.limit)
    const limitParam = paramIndex
    paramIndex++
    values.push(filters.offset)
    const offsetParam = paramIndex

    const result = await query<ActivityUpdate>(
      `SELECT
        au.id,
        au.user_id,
        u.name as user_name,
        u.email as user_email,
        au.update_type,
        au.title,
        au.description,
        au.category,
        au.visibility,
        au.occurred_at,
        au.created_at,
        au.updated_at
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
       ${whereClause}
       ORDER BY au.occurred_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      values
    )

    // Get total count for pagination
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
       ${whereClause}`,
      values.slice(0, -2) // exclude limit/offset
    )

    return apiSuccess({
      items: result.rows,
      total: parseInt(countResult.rows[0]?.count || '0', 10),
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error) {
    return apiError(error, 'Aktivitäten konnten nicht geladen werden')
  }
})

/**
 * POST /api/admin/team/activity/updates
 * Create a new activity update
 */
export const POST = withAdmin(async (request, session) => {
  try {
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
    }

    if (!canAccessSection(user, 'team')) {
      return apiForbidden('Kein Zugriff auf Team-Bereich')
    }

    const body = await request.json()

    // Validate input
    const validation = validateCreateActivityUpdate(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Look up user ID from session email (lowercase to match auth system)
    const userResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [session.user.email.toLowerCase()]
    )

    if (userResult.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    const userId = userResult.rows[0].id

    // Insert activity update
    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.ACTIVITY_UPDATES} (
        user_id,
        update_type,
        title,
        description,
        category,
        visibility,
        occurred_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        userId,
        data.update_type,
        data.title,
        data.description || null,
        data.category || null,
        data.visibility,
        data.occurred_at || new Date().toISOString(),
      ]
    )

    logger.info('Activity update created', {
      updateId: result.rows[0].id,
      userId,
      type: data.update_type,
      title: data.title.substring(0, 50),
    })

    return apiSuccess({ id: result.rows[0].id }, 201)
  } catch (error) {
    return apiError(error, 'Aktivität konnte nicht erstellt werden')
  }
})
