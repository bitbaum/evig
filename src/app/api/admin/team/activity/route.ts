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

import { withAdmin } from '@/lib/api/middleware'
import { db } from '@/db'
import { sql, SQL, getTableName } from 'drizzle-orm'
import {
  apiSuccess,
  apiError,
  apiBadRequest,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { HELP_REQUEST_STATUSES } from '@/config/activity'
import { validateActivityStreamFilter } from '@/lib/schemas/activity'
import { taskCompletions, tasks } from '@/db/schema/misc'
import { activityUpdates, helpRequests } from '@/db/schema/team'
import { users } from '@/db/schema/auth'

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
      return apiBadRequest(ERROR_MESSAGES.INVALID_FILTER_PARAMS)
    }

    const filters = filterResult.data

    // Build source type filter
    const sourceTypes = filters.source_type
      ? [filters.source_type]
      : ['task_completion', 'activity_update', 'help_request']

    // Table names for raw SQL fragments
    const tcTable = getTableName(taskCompletions)
    const uTable = getTableName(users)
    const tTable = getTableName(tasks)
    const auTable = getTableName(activityUpdates)
    const hrTable = getTableName(helpRequests)

    // Build dynamic conditions as SQL fragments
    const buildConditions = (
      userCol: SQL,
      categoryCol: SQL,
      dateCol: SQL
    ): SQL => {
      const parts: SQL[] = []
      if (filters.user_id) {
        parts.push(sql` AND ${userCol} = ${filters.user_id}`)
      }
      if (filters.category) {
        parts.push(sql` AND ${categoryCol} = ${filters.category}`)
      }
      if (filters.since) {
        parts.push(sql` AND ${dateCol} >= ${filters.since}`)
      }
      if (filters.until) {
        parts.push(sql` AND ${dateCol} <= ${filters.until}`)
      }
      return parts.length > 0 ? sql.join(parts, sql``) : sql``
    }

    const unionQueries: SQL[] = []

    // Task completions
    if (sourceTypes.includes('task_completion')) {
      const conditions = buildConditions(
        sql.raw(`tc.completed_by`),
        sql.raw(`t.category`),
        sql.raw(`tc.completed_at`)
      )
      unionQueries.push(sql`
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
        FROM ${sql.raw(tcTable)} tc
        JOIN ${sql.raw(uTable)} u ON tc.completed_by = u.id
        JOIN ${sql.raw(tTable)} t ON tc.task_id = t.id
        WHERE 1=1 ${conditions}
      `)
    }

    // Activity updates
    if (sourceTypes.includes('activity_update')) {
      const conditions = buildConditions(
        sql.raw(`au.user_id`),
        sql.raw(`au.category`),
        sql.raw(`au.occurred_at`)
      )
      unionQueries.push(sql`
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
        FROM ${sql.raw(auTable)} au
        JOIN ${sql.raw(uTable)} u ON au.user_id = u.id
        WHERE 1=1 ${conditions}
      `)
    }

    // Help requests (both created and resolved)
    if (sourceTypes.includes('help_request')) {
      // Created help requests
      const createdConditions = buildConditions(
        sql.raw(`hr.requester_id`),
        sql.raw(`hr.category`),
        sql.raw(`hr.created_at`)
      )
      unionQueries.push(sql`
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
        FROM ${sql.raw(hrTable)} hr
        JOIN ${sql.raw(uTable)} u ON hr.requester_id = u.id
        WHERE 1=1 ${createdConditions}
      `)

      // Resolved help requests (show resolver)
      const resolvedConditions = buildConditions(
        sql.raw(`hr.resolved_by`),
        sql.raw(`hr.category`),
        sql.raw(`hr.resolved_at`)
      )
      unionQueries.push(sql`
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
            'status', ${HELP_REQUEST_STATUSES.RESOLVED},
            'action', ${HELP_REQUEST_STATUSES.RESOLVED},
            'requester_id', hr.requester_id
          ) as metadata,
          hr.resolved_at as occurred_at
        FROM ${sql.raw(hrTable)} hr
        JOIN ${sql.raw(uTable)} u ON hr.resolved_by = u.id
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

    // Combine all queries with UNION ALL
    const unionSql = sql.join(unionQueries, sql` UNION ALL `)

    const combinedQuery = sql`
      WITH unified_activity AS (
        ${unionSql}
      )
      SELECT * FROM unified_activity
      ORDER BY occurred_at DESC
      LIMIT ${filters.limit} OFFSET ${filters.offset}
    `

    const result = await db.execute(combinedQuery)

    // Get total count
    const countQuery = sql`
      WITH unified_activity AS (
        ${unionSql}
      )
      SELECT COUNT(*) as count FROM unified_activity
    `

    const countResult = await db.execute(countQuery)

    return apiSuccess({
      items: result.rows as unknown as UnifiedActivity[],
      total: parseInt((countResult.rows[0] as { count: string })?.count || '0', 10),
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error) {
    return apiError(error, 'Aktivitäten konnten nicht geladen werden')
  }
})
