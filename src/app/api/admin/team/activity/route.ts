/**
 * API: Unified Activity Stream
 *
 * GET /api/admin/team/activity - Get unified activity feed
 *
 * Aggregates:
 * - Task completions
 * - Activity updates (manual entries)
 * - Help requests (created and resolved)
 * - Current focus updates
 *
 * Access: Staff with 'team' permission
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import { validateActivityStreamFilter } from '@/lib/schemas/activity'

interface UnifiedActivity {
  id: string
  source_type: 'task_completion' | 'activity_update' | 'help_request' | 'focus_update'
  user_id: string
  user_name: string | null
  user_email: string
  title: string
  description: string | null
  category: string | null
  metadata: Record<string, unknown>
  occurred_at: string
}

/**
 * GET /api/admin/team/activity
 * Get unified activity stream from all sources
 */
export const GET = withAdmin('team', async (request, session) => {
  try {
    // Parse filters from query params
    const { searchParams } = new URL(request.url)
    const filterResult = validateActivityStreamFilter({
      user_id: searchParams.get('user_id') || undefined,
      source_type: searchParams.get('source_type') || undefined,
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

    // Build source type filter
    const sourceTypes = filters.source_type
      ? [filters.source_type]
      : ['task_completion', 'activity_update', 'help_request']

    // Track parameters for parameterized queries
    const params: (string | number)[] = []
    let paramIndex = 1

    // Helper to add a parameter and return placeholder
    const addParam = (value: string | number): string => {
      params.push(value)
      return `$${paramIndex++}`
    }

    // Build filter conditions with parameterized placeholders
    const buildConditions = (
      userCol: string,
      categoryCol: string,
      dateCol: string
    ): string => {
      const conditions: string[] = []
      if (filters.user_id) {
        conditions.push(`${userCol} = ${addParam(filters.user_id)}`)
      }
      if (filters.category) {
        conditions.push(`${categoryCol} = ${addParam(filters.category)}`)
      }
      if (filters.since) {
        conditions.push(`${dateCol} >= ${addParam(filters.since)}`)
      }
      if (filters.until) {
        conditions.push(`${dateCol} <= ${addParam(filters.until)}`)
      }
      return conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''
    }

    const unionQueries: string[] = []

    // Task completions
    if (sourceTypes.includes('task_completion')) {
      const conditions = buildConditions('tc.completed_by', 't.category', 'tc.completed_at')
      unionQueries.push(`
        SELECT
          tc.id::text as id,
          'task_completion' as source_type,
          tc.completed_by as user_id,
          u.name as user_name,
          u.email as user_email,
          t.title as title,
          tc.notes as description,
          t.category as category,
          jsonb_build_object(
            'task_id', t.id,
            'duration_minutes', tc.duration_minutes,
            'task_type', t.task_type
          ) as metadata,
          tc.completed_at as occurred_at
        FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
        JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
        JOIN ${TABLE_NAMES.TASKS} t ON tc.task_id = t.id
        WHERE 1=1 ${conditions}
      `)
    }

    // Activity updates
    if (sourceTypes.includes('activity_update')) {
      const conditions = buildConditions('au.user_id', 'au.category', 'au.occurred_at')
      unionQueries.push(`
        SELECT
          au.id::text as id,
          'activity_update' as source_type,
          au.user_id,
          u.name as user_name,
          u.email as user_email,
          au.title,
          au.description,
          au.category,
          jsonb_build_object(
            'update_type', au.update_type,
            'visibility', au.visibility
          ) as metadata,
          au.occurred_at
        FROM ${TABLE_NAMES.ACTIVITY_UPDATES} au
        JOIN ${TABLE_NAMES.USERS} u ON au.user_id = u.id
        WHERE 1=1 ${conditions}
      `)
    }

    // Help requests (both created and resolved)
    if (sourceTypes.includes('help_request')) {
      // Created help requests
      const createdConditions = buildConditions('hr.requester_id', 'hr.category', 'hr.created_at')
      unionQueries.push(`
        SELECT
          hr.id::text || '_created' as id,
          'help_request' as source_type,
          hr.requester_id as user_id,
          u.name as user_name,
          u.email as user_email,
          'Hilfsanfrage: ' || hr.title as title,
          hr.description,
          hr.category,
          jsonb_build_object(
            'request_id', hr.id,
            'urgency', hr.urgency,
            'is_broadcast', hr.is_broadcast,
            'status', hr.status,
            'action', 'created'
          ) as metadata,
          hr.created_at as occurred_at
        FROM ${TABLE_NAMES.HELP_REQUESTS} hr
        JOIN ${TABLE_NAMES.USERS} u ON hr.requester_id = u.id
        WHERE 1=1 ${createdConditions}
      `)

      // Resolved help requests (show resolver)
      const resolvedConditions = buildConditions('hr.resolved_by', 'hr.category', 'hr.resolved_at')
      unionQueries.push(`
        SELECT
          hr.id::text || '_resolved' as id,
          'help_request' as source_type,
          hr.resolved_by as user_id,
          u.name as user_name,
          u.email as user_email,
          'Gelöst: ' || hr.title as title,
          hr.resolution_notes as description,
          hr.category,
          jsonb_build_object(
            'request_id', hr.id,
            'urgency', hr.urgency,
            'is_broadcast', hr.is_broadcast,
            'status', 'resolved',
            'action', 'resolved',
            'requester_id', hr.requester_id
          ) as metadata,
          hr.resolved_at as occurred_at
        FROM ${TABLE_NAMES.HELP_REQUESTS} hr
        JOIN ${TABLE_NAMES.USERS} u ON hr.resolved_by = u.id
        WHERE hr.resolved_by IS NOT NULL ${resolvedConditions}
      `)
    }

    if (unionQueries.length === 0) {
      return apiSuccess({
        items: [],
        total: 0,
        limit: filters.limit,
        offset: filters.offset,
      })
    }

    // Add limit and offset as parameters
    const limitParam = addParam(filters.limit)
    const offsetParam = addParam(filters.offset)

    // Combine all queries with UNION ALL
    const combinedQuery = `
      WITH unified_activity AS (
        ${unionQueries.join('\n        UNION ALL\n        ')}
      )
      SELECT * FROM unified_activity
      ORDER BY occurred_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `

    const result = await query<UnifiedActivity>(combinedQuery, params)

    // Get total count (reuse same filter params, exclude limit/offset)
    const countParams = params.slice(0, -2)
    const countQuery = `
      WITH unified_activity AS (
        ${unionQueries.join('\n        UNION ALL\n        ')}
      )
      SELECT COUNT(*) as count FROM unified_activity
    `

    const countResult = await query<{ count: string }>(countQuery, countParams)

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
