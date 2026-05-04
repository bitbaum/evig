/**
 * Admin Task Detail Page - Server Component
 *
 * Shows task details, completion history, and actions.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDateTimeNumeric, formatDateShort } from '@/lib/date-formats'
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
  REQUEST_STATUSES,
} from '@/config/tasks'
import type {
  TaskDetail,
  TaskCompletion,
  TaskAttentionFlag,
  TaskRequestRecord,
} from '@/lib/schemas/tasks'
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Send,
  Edit,
} from 'lucide-react'
import TaskActionsClient from './TaskActionsClient'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Aufgabe Details',
  description: 'Aufgabendetails und Verlauf anzeigen.',
}

async function getTask(id: string): Promise<TaskDetail | null> {
  try {
    const result = await query<TaskDetail>(
      `SELECT
        t.*,
        u.name as created_by_name,
        u.email as created_by_email,
        au.name as assigned_to_name
      FROM ${TABLE_NAMES.TASKS} t
      LEFT JOIN ${TABLE_NAMES.USERS} u ON t.created_by = u.id
      LEFT JOIN ${TABLE_NAMES.USERS} au ON t.assigned_to = au.id
      WHERE t.id = $1`,
      [id]
    )
    return result.rows[0] || null
  } catch (error) {
    logger.error('Error fetching task', { error, taskId: id })
    return null
  }
}

async function getCompletions(taskId: string): Promise<TaskCompletion[]> {
  try {
    const result = await query<TaskCompletion>(
      `SELECT
        tc.*,
        u.name as completed_by_name,
        u.email as completed_by_email
      FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
      LEFT JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.completed_at DESC
      LIMIT 50`,
      [taskId]
    )
    return result.rows
  } catch (error) {
    logger.error('Error fetching completions', { error, taskId })
    return []
  }
}

async function getAttentionFlags(taskId: string): Promise<TaskAttentionFlag[]> {
  try {
    const result = await query<TaskAttentionFlag>(
      `SELECT
        f.*,
        u.name as flagged_by_name
      FROM ${TABLE_NAMES.TASK_ATTENTION_FLAGS} f
      LEFT JOIN ${TABLE_NAMES.USERS} u ON f.flagged_by = u.id
      WHERE f.task_id = $1
      ORDER BY f.created_at DESC`,
      [taskId]
    )
    return result.rows
  } catch (error) {
    logger.error('Error fetching attention flags', { error, taskId })
    return []
  }
}

async function getRequests(taskId: string): Promise<TaskRequestRecord[]> {
  try {
    const result = await query<TaskRequestRecord>(
      `SELECT
        r.*,
        rb.name as requested_by_name,
        ru.name as requested_user_name
      FROM ${TABLE_NAMES.TASK_REQUESTS} r
      LEFT JOIN ${TABLE_NAMES.USERS} rb ON r.requested_by = rb.id
      LEFT JOIN ${TABLE_NAMES.USERS} ru ON r.requested_user_id = ru.id
      WHERE r.task_id = $1
      ORDER BY r.created_at DESC`,
      [taskId]
    )
    return result.rows
  } catch (error) {
    logger.error('Error fetching task requests', { error, taskId })
    return []
  }
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const task = await getTask(id)

  if (!task) {
    notFound()
  }

  const [completions, flags, requests] = await Promise.all([
    getCompletions(id),
    getAttentionFlags(id),
    getRequests(id),
  ])

  const activeFlags = flags.filter((f) => !f.is_resolved)
  const pendingRequests = requests.filter((r) => r.status === REQUEST_STATUSES.PENDING)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tasks"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück
          </Link>
          <div className="w-px h-6 bg-neutral-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-info-600" />
            </div>
            <div>
              <Heading level={1} className="text-2xl font-bold text-neutral-900">{task.title}</Heading>
              <p className="text-neutral-600">
                {TASK_CATEGORY_LABELS[task.category]} · {TASK_TYPE_LABELS[task.task_type]}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/tasks/${id}/edit`}
            className="px-4 py-2 text-sm text-neutral-600 hover:text-neutral-900 border border-neutral-200 hover:border-neutral-300 rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Bearbeiten
          </Link>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            TASK_STATUS_COLORS[task.current_status] || 'bg-neutral-100 text-neutral-800'
          }`}
        >
          {TASK_STATUS_LABELS[task.current_status]}
        </span>
        <span
          className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
            TASK_PRIORITY_COLORS[task.priority] || 'bg-neutral-100 text-neutral-800'
          }`}
        >
          {TASK_PRIORITY_LABELS[task.priority]}
        </span>
        {task.is_completed && (
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800">
            Abgeschlossen
          </span>
        )}
        {task.is_archived && (
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-neutral-100 text-neutral-800">
            Archiviert
          </span>
        )}
      </div>

      {/* Active Alerts */}
      {activeFlags.length > 0 && (
        <div className="bg-error-50 border border-error-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5" />
            <div>
              <Heading level={3} className="font-medium text-error-800">
                Aufgabe braucht Aufmerksamkeit
              </Heading>
              {activeFlags.map((flag) => (
                <p key={flag.id} className="text-sm text-error-700 mt-1">
                  {flag.flagged_by_name || 'Jemand'}: {flag.message || 'Keine Nachricht'}
                  <span className="text-error-500 ml-2">
                    ({formatDateTimeNumeric(flag.created_at)})
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Send className="w-5 h-5 text-warning-600 mt-0.5" />
            <div>
              <Heading level={3} className="font-medium text-warning-800">Offene Anfragen</Heading>
              {pendingRequests.map((req) => (
                <p key={req.id} className="text-sm text-warning-700 mt-1">
                  {req.requested_by_name || 'Jemand'} fragt{' '}
                  {req.is_broadcast
                    ? 'alle Teammitglieder'
                    : req.requested_user_name || 'jemanden'}
                  {req.message && `: "${req.message}"`}
                  <span className="text-warning-500 ml-2">
                    ({formatDateTimeNumeric(req.created_at)})
                  </span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {task.description && (
            <div className="bg-white rounded-lg border p-6">
              <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-3">
                Beschreibung
              </Heading>
              <p className="text-neutral-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Instructions */}
          {task.instructions && (
            <div className="bg-white rounded-lg border p-6">
              <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-3">Anleitung</Heading>
              <div className="text-neutral-700 whitespace-pre-wrap">{task.instructions}</div>
            </div>
          )}

          {/* Actions */}
          <TaskActionsClient taskId={task.id} taskTitle={task.title} isArchived={task.is_archived} />

          {/* Completion History */}
          <div className="bg-white rounded-lg border p-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">
              Erledigungen ({completions.length})
            </Heading>
            {completions.length === 0 ? (
              <p className="text-neutral-500">Noch keine Erledigungen</p>
            ) : (
              <div className="space-y-4">
                {completions.map((completion) => (
                  <div
                    key={completion.id}
                    className="flex items-start gap-3 pb-4 border-b last:border-0"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-neutral-900">
                          {completion.completed_by_name || completion.completed_by_email || 'Unbekannt'}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {formatDateTimeNumeric(completion.completed_at)}
                        </p>
                      </div>
                      {completion.duration_minutes && (
                        <p className="text-sm text-neutral-600">
                          Dauer: {completion.duration_minutes} Minuten
                        </p>
                      )}
                      {completion.notes && (
                        <p className="text-sm text-neutral-600 mt-1">
                          {completion.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <div className="bg-white rounded-lg border p-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">Details</Heading>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-neutral-500">Erstellt von</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-900">
                    {task.created_by_name || task.created_by_email || 'Unbekannt'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Zugewiesen an</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-900">
                    {task.assigned_to_name || 'Nicht zugewiesen'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm text-neutral-500">Erstellt am</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-900">{formatDateTimeNumeric(task.created_at)}</span>
                </dd>
              </div>
              {task.estimated_minutes && (
                <div>
                  <dt className="text-sm text-neutral-500">Geschätzte Dauer</dt>
                  <dd className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-900">
                      {task.estimated_minutes} Minuten
                    </span>
                  </dd>
                </div>
              )}
              {task.due_date && (() => {
                const isOverdue = !task.is_completed && new Date(task.due_date) < new Date(new Date().toDateString())
                return (
                  <div>
                    <dt className="text-sm text-neutral-500">Fälligkeitsdatum</dt>
                    <dd className="flex items-center gap-2 mt-1">
                      <Calendar className={`w-4 h-4 ${isOverdue ? 'text-error-500' : 'text-neutral-400'}`} />
                      <span className={isOverdue ? 'text-error-600 font-medium' : 'text-neutral-900'}>
                        {formatDateShort(task.due_date)}
                        {isOverdue && ' (überfällig)'}
                      </span>
                    </dd>
                  </div>
                )
              })()}
              {task.schedule_human && (
                <div>
                  <dt className="text-sm text-neutral-500">Zeitplan</dt>
                  <dd className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-900">{task.schedule_human}</span>
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border p-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">Statistiken</Heading>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Erledigungen gesamt</span>
                <span className="font-medium text-neutral-900">{completions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Aufmerksamkeits-Flags</span>
                <span className="font-medium text-neutral-900">{flags.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Anfragen</span>
                <span className="font-medium text-neutral-900">{requests.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
