/**
 * Admin Tasks Page - Server Component
 *
 * Shows task list with filters and quick actions.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { Suspense } from 'react'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { formatDateShort } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
  TASK_STATUSES,
  TASK_PRIORITIES,
  REQUEST_STATUSES,
} from '@/config/tasks'
import type { TaskListItem } from '@/lib/schemas/tasks'
import {
  Plus,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import Heading from '@/components/admin/AdminHeading'
import TaskFiltersClient from './TaskFiltersClient'
import { Pagination } from '@/components/ui/Pagination'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { PAGINATION } from '@/config/pagination'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Aufgaben',
  description: 'Teamaufgaben verwalten und koordinieren.',
}

interface TaskStats {
  total: number
  needsAttention: number
  requested: number
  completedToday: number
}

async function getTaskStats(): Promise<TaskStats> {
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
      total: parseInt(row?.total || '0'),
      needsAttention: parseInt(row?.needs_attention || '0'),
      requested: parseInt(row?.requested || '0'),
      completedToday: parseInt(row?.completed_today || '0'),
    }
  } catch (error) {
    logger.error('Error fetching task stats', { error })
    return { total: 0, needsAttention: 0, requested: 0, completedToday: 0 }
  }
}

const TASKS_PAGE_SIZE = PAGINATION.PUBLIC

async function getTasks(
  category?: string,
  status?: string,
  q?: string,
  priority?: string,
  page = 1,
): Promise<{ rows: TaskListItem[]; total: number }> {
  let filterClause = `WHERE NOT t.is_archived`

  const params: (string | number)[] = []
  let paramIndex = 1

  if (category) {
    filterClause += ` AND t.category = $${paramIndex++}`
    params.push(category)
  }

  if (status) {
    filterClause += ` AND t.current_status = $${paramIndex++}`
    params.push(status)
  }

  if (q) {
    filterClause += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`
    params.push(`%${q}%`)
    paramIndex++
  }

  if (priority) {
    filterClause += ` AND t.priority = $${paramIndex++}`
    params.push(priority)
  }

  const countText = `
    SELECT COUNT(*)::text as total
    FROM ${TABLE_NAMES.TASKS} t
    ${filterClause}
  `

  const offset = (page - 1) * TASKS_PAGE_SIZE

  // CASE/WHEN values are compile-time constants from config, not user input.
  // SQL CASE expressions don't support parameterized values ($N).
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
      -- Open request signal — surfaces the broadcast-vs-targeted distinction
      -- on the task list itself, killing one detail-page click for staff
      -- triaging "what's pending input from me?". Per admin UX audit Y/Z phase.
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
    total: parseInt(countResult.rows[0]?.total || '0', 10),
  }
}

export default async function TasksAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string; q?: string; priority?: string; page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const stats = await getTaskStats()

  let tasks: TaskListItem[] = []
  let totalTasks = 0
  let listError = false
  try {
    const result = await getTasks(params.category, params.status, params.q, params.priority, currentPage)
    tasks = result.rows
    totalTasks = result.total
  } catch (error) {
    logger.error('Error fetching tasks', { error })
    listError = true
  }

  const totalPages = Math.ceil(totalTasks / TASKS_PAGE_SIZE)

  const tasksHrefBase = (() => {
    const p = new URLSearchParams()
    if (params.category) p.set('category', params.category)
    if (params.status) p.set('status', params.status)
    if (params.q) p.set('q', params.q)
    if (params.priority) p.set('priority', params.priority)
    const qs = p.toString()
    return `${ROUTES.admin.tasks}${qs ? `?${qs}` : ''}`
  })()

  return (
    <AdminPageWrapper
      title="Aufgaben"
      description="Teamaufgaben verwalten und koordinieren"
      icon={ClipboardList}
      iconColor="blue"
      actions={
        <>
          <Link
            href={ROUTES.admin.tasksAnalytics}
            className="px-4 py-2 text-sm text-text-secondary hover:text-neutral-900 border border hover:border-neutral-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Statistiken
          </Link>
          <Link href={ROUTES.admin.taskNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </Link>
        </>
      }
    >
      {/* Stats Cards — clickable as quick filters */}
      <AdminStatsGrid items={[
        {
          icon: ClipboardList,
          color: 'gray',
          label: 'Gesamt',
          value: stats.total,
          href: ROUTES.admin.tasks,
        },
        {
          icon: AlertTriangle,
          color: 'red',
          label: 'Braucht Aufmerksamkeit',
          value: stats.needsAttention,
          valueColor: 'text-error-600',
          href: `${ROUTES.admin.tasks}?status=${TASK_STATUSES.NEEDS_ATTENTION}`,
        },
        {
          icon: Clock,
          color: 'amber',
          label: 'Angefragt',
          value: stats.requested,
          valueColor: 'text-warning-600',
          href: `${ROUTES.admin.tasks}?status=${TASK_STATUSES.REQUESTED}`,
        },
        {
          icon: CheckCircle2,
          color: 'green',
          label: 'Heute erledigt',
          value: stats.completedToday,
          valueColor: 'text-action',
        },
      ] satisfies StatCardItem[]} />

      {/* Filters */}
      <Suspense fallback={<div className="bg-surface-base rounded-lg border p-4 h-14" />}>
        <TaskFiltersClient />
      </Suspense>

      {/* Task List */}
      <div className="bg-surface-base rounded-lg border overflow-hidden overflow-x-auto">
        {listError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-error-400 mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
              {ADMIN_CONTENT.tasks.errorMessage}
            </Heading>
            <p className="text-text-secondary mb-4">
              Es gab ein Problem beim Laden der Aufgaben. Bitte versuche es erneut.
            </p>
            <Link href={ROUTES.admin.tasks} className={buttonClass({ variant: 'primary' })}>
              Seite neu laden
            </Link>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
              {ADMIN_CONTENT.tasks.emptyTitle}
            </Heading>
            <p className="text-text-secondary mb-4">
              {ADMIN_CONTENT.tasks.emptyDescription}
            </p>
            <Link href={ROUTES.admin.taskNew} className={buttonClass({ variant: 'primary' })}>
              <Plus className="w-4 h-4" />
              Neue Aufgabe
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-surface-raised border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Aufgabe
                </th>
                {/* Kategorie hidden on mobile */}
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Kategorie
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Priorität
                </th>
                {/* Zeitplan — replaces "Typ" (per admin UX audit: schedule
                    is what staff actually need to know — "Jeden Montag" vs
                    "Wiederkehrend (geplant)" — the human string beats the
                    type enum). Falls back to type label for one-off tasks. */}
                <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Zeitplan
                </th>
                {/* Zugewiesen hidden on mobile and tablet */}
                <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Zugewiesen
                </th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                  Fällig
                </th>
                <th className="hidden sm:table-cell text-right px-4 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wide whitespace-nowrap">
                  Erledigungen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-3 max-w-[200px] sm:max-w-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={ROUTES.admin.task(task.id)}
                        className="font-medium text-text-primary hover:text-primary-600 truncate min-w-0 focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 rounded-sm"
                      >
                        {task.title}
                      </Link>
                      {/* Request signal — broadcast (📢 any-staff) outranks
                          targeted (👤 user-specific). Per admin UX audit Z.1:
                          surfaces "what's pending input?" without a click. */}
                      {task.has_open_broadcast ? (
                        <span
                          className="inline-flex shrink-0 items-center text-xs"
                          aria-label={`${task.open_request_count} offene Broadcast-Anfrage(n)`}
                          title={`${task.open_request_count} offene Anfrage(n) — Broadcast`}
                        >📢</span>
                      ) : task.open_request_count > 0 ? (
                        <span
                          className="inline-flex shrink-0 items-center text-xs"
                          aria-label={`${task.open_request_count} offene gezielte Anfrage(n)`}
                          title={`${task.open_request_count} offene Anfrage(n) — gezielt`}
                        >👤</span>
                      ) : null}
                    </div>
                    {task.description && (
                      <p className="text-sm text-text-tertiary truncate max-w-full">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-text-secondary">
                      {TASK_CATEGORY_LABELS[task.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        TASK_STATUS_COLORS[task.current_status] || 'bg-surface-raised text-neutral-800'
                      }`}
                    >
                      {TASK_STATUS_LABELS[task.current_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                        TASK_PRIORITY_COLORS[task.priority] || 'bg-surface-raised text-neutral-800'
                      }`}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-text-secondary">
                      {task.schedule_human || TASK_TYPE_LABELS[task.task_type]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap">
                    {task.assigned_to_name ? (
                      <span className="text-sm text-text-secondary">{task.assigned_to_name}</span>
                    ) : (
                      <span className="text-sm text-text-muted">&mdash;</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap">
                    {task.due_date ? (() => {
                      const isOverdue = !task.is_completed && new Date(task.due_date) < new Date(new Date().toDateString())
                      return (
                        <span className={`text-sm ${isOverdue ? 'text-error-600 font-medium' : 'text-text-secondary'}`}>
                          {formatDateShort(task.due_date)}
                          {isOverdue && ' (überfällig)'}
                        </span>
                      )
                    })() : (
                      <span className="text-sm text-text-muted">—</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3 text-right whitespace-nowrap">
                    <span className="text-sm text-text-secondary">
                      {task.completion_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalTasks}
          pageSize={TASKS_PAGE_SIZE}
          hrefBase={tasksHrefBase}
        />
      </div>
    </AdminPageWrapper>
  )
}
