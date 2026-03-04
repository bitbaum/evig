/**
 * API: Help Requests
 *
 * GET  /api/admin/team/help-requests - List help requests
 * POST /api/admin/team/help-requests - Create help request
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { QueryParams } from '@/lib/api/query-builder'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import {
  validateCreateHelpRequest,
  validateHelpRequestFilter,
} from '@/lib/schemas/activity'

interface HelpRequest {
  id: string
  requester_id: string
  requester_name: string | null
  requester_email: string
  title: string
  description: string | null
  category: string | null
  urgency: string
  requested_user_id: string | null
  requested_user_name: string | null
  requested_user_email: string | null
  is_broadcast: boolean
  status: string
  resolved_by: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

/**
 * GET /api/admin/team/help-requests
 * List help requests with optional filters
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filterResult = validateHelpRequestFilter({
      status: searchParams.get('status') || undefined,
      urgency: searchParams.get('urgency') || undefined,
      category: searchParams.get('category') || undefined,
      requester_id: searchParams.get('requester_id') || undefined,
      requested_user_id: searchParams.get('requested_user_id') || undefined,
      is_broadcast: searchParams.get('is_broadcast') || undefined,
      limit: searchParams.get('limit') || 50,
      offset: searchParams.get('offset') || 0,
    })

    if (!filterResult.success) {
      return apiBadRequest('Ungültige Filterparameter')
    }

    const filters = filterResult.data
    const qb = new QueryParams()

    if (filters.status) {
      qb.add('hr.status = $P', filters.status)
    }

    if (filters.urgency) {
      qb.add('hr.urgency = $P', filters.urgency)
    }

    if (filters.category) {
      qb.add('hr.category = $P', filters.category)
    }

    if (filters.requester_id) {
      qb.add('hr.requester_id = $P', filters.requester_id)
    }

    if (filters.requested_user_id) {
      qb.add('hr.requested_user_id = $P', filters.requested_user_id)
    }

    if (filters.is_broadcast !== undefined) {
      qb.add('hr.is_broadcast = $P', filters.is_broadcast)
    }

    const { where: whereClause, params, nextIndex } = qb.build()

    const result = await query<HelpRequest>(
      `SELECT
        hr.id,
        hr.requester_id,
        req_u.name as requester_name,
        req_u.email as requester_email,
        hr.title,
        hr.description,
        hr.category,
        hr.urgency,
        hr.requested_user_id,
        target_u.name as requested_user_name,
        target_u.email as requested_user_email,
        hr.is_broadcast,
        hr.status,
        hr.resolved_by,
        resolver_u.name as resolved_by_name,
        hr.resolved_at,
        hr.resolution_notes,
        hr.created_at,
        hr.updated_at
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       JOIN ${TABLE_NAMES.USERS} req_u ON hr.requester_id = req_u.id
       LEFT JOIN ${TABLE_NAMES.USERS} target_u ON hr.requested_user_id = target_u.id
       LEFT JOIN ${TABLE_NAMES.USERS} resolver_u ON hr.resolved_by = resolver_u.id
       ${whereClause}
       ORDER BY
         CASE hr.urgency
           WHEN 'urgent' THEN 1
           WHEN 'high' THEN 2
           WHEN 'normal' THEN 3
           WHEN 'low' THEN 4
         END,
         hr.created_at DESC
       LIMIT $${nextIndex} OFFSET $${nextIndex + 1}`,
      [...params, filters.limit, filters.offset]
    )

    // Get total count for pagination
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM ${TABLE_NAMES.HELP_REQUESTS} hr
       ${whereClause}`,
      params
    )

    return apiSuccess({
      items: result.rows,
      total: parseInt(countResult.rows[0]?.count || '0', 10),
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error) {
    return apiError(error, 'Hilfsanfragen konnten nicht geladen werden')
  }
})

/**
 * POST /api/admin/team/help-requests
 * Create a new help request
 */
export const POST = withAdmin('team', async (request, session) => {
  try {
    const body = await request.json()

    // Validate input
    const validation = validateCreateHelpRequest(body)
    if (!validation.success) {
      return apiBadRequest(
        'Validierungsfehler',
        validation.error.flatten().fieldErrors as Record<string, string[]>
      )
    }

    const data = validation.data

    // Look up requester user ID from session email (lowercase to match auth system)
    const requesterResult = await query<{ id: string }>(
      `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
      [session.user.email.toLowerCase()]
    )

    if (requesterResult.rows.length === 0) {
      return apiBadRequest('Benutzer nicht gefunden')
    }

    const requesterId = requesterResult.rows[0].id

    // If targeted request, verify target user exists
    if (data.requested_user_id) {
      const targetResult = await query<{ id: string }>(
        `SELECT id FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
        [data.requested_user_id]
      )

      if (targetResult.rows.length === 0) {
        return apiBadRequest('Zielbenutzer nicht gefunden')
      }
    }

    // Insert help request
    const result = await query<{ id: string }>(
      `INSERT INTO ${TABLE_NAMES.HELP_REQUESTS} (
        requester_id,
        title,
        description,
        category,
        urgency,
        requested_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        requesterId,
        data.title,
        data.description || null,
        data.category || null,
        data.urgency,
        data.requested_user_id || null,
      ]
    )

    logger.info('Help request created', {
      requestId: result.rows[0].id,
      requesterId,
      urgency: data.urgency,
      isBroadcast: !data.requested_user_id,
      title: data.title.substring(0, 50),
    })

    return apiSuccess({ id: result.rows[0].id }, 201)
  } catch (error) {
    return apiError(error, 'Hilfsanfrage konnte nicht erstellt werden')
  }
})
