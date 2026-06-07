/**
 * Data layer for /admin/tasks list page.
 *
 * Pure SQL + DTO shaping — no React. Keeps the page component focused on
 * orchestration and TaskTable focused on presentation.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  REQUEST_STATUSES,
} from '@/config/tasks'
import type { TaskListItem } from '@/lib/schemas/tasks'
import { PAGINATION } from '@/config/pagination'

export const TASKS_PAGE_SIZE = PAGINATION.PUBLIC

export interface TaskStats {
  total: number
  needsAttention: number
  requested: number
  completedToday: number
}

export async function getTaskStats(): Promise<TaskStats> {
  try {
    const result = await query<{
      total: string
      needs_attention: string
      requested: string
      completed_today: string
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE NOT is_archived) as total,
        COUNT(*) FILTER (WHERE current_status = $1 AND NOT is_archived) as needs_attention,
        COUNT(*) FILTER (WHERE current_status = $2 AND NOT is_archived) as requested,
        (
          SELECT COUNT(*)
          FROM ${TABLE_NAMES.TASK_COMPLETIONS}
          WHERE DATE(completed_at) = CURRENT_DATE
        ) as completed_today
      FROM ${TABLE_NAMES.TASKS}
    `, [TASK_STATUSES.NEEDS_ATTENTION, TASK_STATUSES.REQUESTED])

    const row = result.rows[0]
    return {
      total:          parseInt(row?.total ?? '0', 10),
      needsAttention: parseInt(row?.needs_attention ?? '0', 10),
      requested:      parseInt(row?.requested ?? '0', 10),
      completedToday: parseInt(row?.completed_today ?? '0', 10),
    }
  } catch (error) {
    logger.error('Error fetching task stats', { error })
    return { total: 0, needsAttention: 0, requested: 0, completedToday: 0 }
  }
}

export interface TasksQuery {
  category?: string
  status?: string
  q?: string
  priority?: string
  page?: number
}

export async function getTasks(
  filters: TasksQuery = {},
): Promise<{ rows: TaskListItem[]; total: number }> {
  const { category, status, q, priority, page = 1 } = filters

  let filterClause = `WHERE NOT t.is_archived`
  const params: (string | number)[] = []
  let paramIndex = 1

  if (category) { filterClause += ` AND t.category = $${paramIndex++}`; params.push(category) }
  if (status)   { filterClause += ` AND t.current_status = $${paramIndex++}`; params.push(status) }
  if (q) {
    filterClause += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`
    params.push(`%${q}%`)
    paramIndex++
  }
  if (priority) { filterClause += ` AND t.priority = $${paramIndex++}`; params.push(priority) }

  const offset = (page - 1) * TASKS_PAGE_SIZE

  const countText = `
    SELECT COUNT(*)::text as total
    FROM ${TABLE_NAMES.TASKS} t
    ${filterClause}
  `

  // CASE/WHEN values below are compile-time constants from config, not
  // user input — SQL CASE expressions can't be parameterized.
  const listText = `
    SELECT
      t.id,
      t.title,
      t.description,
      t.task_type,
      t.schedule_human,
      t.category,
      t.priority,
      t.current_status,
      t.estimated_minutes,
      t.due_date,
      t.is_completed,
      t.created_at,
      t.assigned_to,
      u.name as created_by_name,
      au.name as assigned_to_name,
      (
        SELECT COUNT(*)::int
        FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
        WHERE tc.task_id = t.id
      ) as completion_count,
      (
        SELECT COUNT(*)::int
        FROM ${TABLE_NAMES.TASK_REQUESTS} tr
        WHERE tr.task_id = t.id AND tr.status = '${REQUEST_STATUSES.PENDING}'
      ) as open_request_count,
      EXISTS (
        SELECT 1 FROM ${TABLE_NAMES.TASK_REQUESTS} tr
        WHERE tr.task_id = t.id AND tr.status = '${REQUEST_STATUSES.PENDING}' AND tr.requested_user_id IS NULL
      ) as has_open_broadcast
    FROM ${TABLE_NAMES.TASKS} t
    LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
    LEFT JOIN ${TABLE_NAMES.USERS} au ON t.assigned_to = au.id
    ${filterClause}
    ORDER BY
      CASE t.current_status
        WHEN '${TASK_STATUSES.NEEDS_ATTENTION}' THEN 0
        WHEN '${TASK_STATUSES.REQUESTED}' THEN 1
        WHEN '${TASK_STATUSES.IN_PROGRESS}' THEN 2
        WHEN '${TASK_STATUSES.IDLE}' THEN 3
      END,
      CASE t.priority
        WHEN '${TASK_PRIORITIES.URGENT}' THEN 0
        WHEN '${TASK_PRIORITIES.HIGH}' THEN 1
        WHEN '${TASK_PRIORITIES.NORMAL}' THEN 2
        WHEN '${TASK_PRIORITIES.LOW}' THEN 3
      END,
      t.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `

  const [countResult, listResult] = await Promise.all([
    query<{ total: string }>(countText, params),
    query<TaskListItem>(listText, [...params, TASKS_PAGE_SIZE, offset]),
  ])

  return {
    rows: listResult.rows,
    total: parseInt(countResult.rows[0]?.total ?? '0', 10),
  }
}

/**
 * Build the canonical `?key=value&…` query string for pagination/sorting
 * links. Keeps filter SSOT in one place so callers can't drift.
 */
export function buildTasksHrefBase(basePath: string, filters: TasksQuery): string {
  const p = new URLSearchParams()
  if (filters.category) p.set('category', filters.category)
  if (filters.status)   p.set('status',   filters.status)
  if (filters.q)        p.set('q',        filters.q)
  if (filters.priority) p.set('priority', filters.priority)
  const qs = p.toString()
  return `${basePath}${qs ? `?${qs}` : ''}`
}
