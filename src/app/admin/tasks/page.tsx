/**
 * Admin Tasks Page - Server Component
 *
 * Shows task list with filters and quick actions.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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
import TaskFiltersClient from './TaskFiltersClient'

export const metadata: Metadata = {
  title: 'Aufgaben | RevampIT Admin',
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
        COUNT(*) FILTER (WHERE current_status = '${TASK_STATUSES.NEEDS_ATTENTION}' AND NOT is_archived) as needs_attention,
        COUNT(*) FILTER (WHERE current_status = '${TASK_STATUSES.REQUESTED}' AND NOT is_archived) as requested,
        (
          SELECT COUNT(*)
          FROM ${TABLE_NAMES.TASK_COMPLETIONS}
          WHERE DATE(completed_at) = CURRENT_DATE
        ) as completed_today
      FROM ${TABLE_NAMES.TASKS}
    `)

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

async function getTasks(
  category?: string,
  status?: string
): Promise<TaskListItem[]> {
  try {
    let queryText = `
      SELECT
        t.id,
        t.title,
        t.description,
        t.task_type,
        t.category,
        t.priority,
        t.current_status,
        t.estimated_minutes,
        t.is_completed,
        t.created_at,
        u.name as created_by_name,
        (
          SELECT COUNT(*)::int
          FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
          WHERE tc.task_id = t.id
        ) as completion_count
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
      WHERE NOT t.is_archived
    `

    const params: string[] = []
    let paramIndex = 1

    if (category) {
      queryText += ` AND t.category = $${paramIndex++}`
      params.push(category)
    }

    if (status) {
      queryText += ` AND t.current_status = $${paramIndex++}`
      params.push(status)
    }

    queryText += `
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
      LIMIT 100
    `

    const result = await query<TaskListItem>(queryText, params)
    return result.rows
  } catch (error) {
    logger.error('Error fetching tasks', { error })
    return []
  }
}

export default async function TasksAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>
}) {
  const params = await searchParams
  const stats = await getTaskStats()
  const tasks = await getTasks(params.category, params.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufgaben</h1>
            <p className="text-gray-600">Teamaufgaben verwalten und koordinieren</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/tasks/analytics"
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <BarChart3 className="w-4 h-4" />
            Statistiken
          </Link>
          <Link
            href="/admin/tasks/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Braucht Aufmerksamkeit</p>
              <p className="text-2xl font-bold text-red-600">{stats.needsAttention}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Angefragt</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.requested}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Heute erledigt</p>
              <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="bg-white rounded-lg border p-4 h-14" />}>
        <TaskFiltersClient />
      </Suspense>

      {/* Task List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {tasks.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Aufgaben gefunden
            </h3>
            <p className="text-gray-600 mb-4">
              Erstellen Sie Ihre erste Aufgabe, um loszulegen.
            </p>
            <Link
              href="/admin/tasks/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Neue Aufgabe
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Aufgabe
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Kategorie
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Priorität
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Typ
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  Erledigungen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tasks/${task.id}`}
                      className="font-medium text-gray-900 hover:text-blue-600"
                    >
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="text-sm text-gray-500 truncate max-w-md">
                        {task.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {TASK_CATEGORY_LABELS[task.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        TASK_STATUS_COLORS[task.current_status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {TASK_STATUS_LABELS[task.current_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        TASK_PRIORITY_COLORS[task.priority] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {TASK_TYPE_LABELS[task.task_type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm text-gray-600">
                      {task.completion_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
