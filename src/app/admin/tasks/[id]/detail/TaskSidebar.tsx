/**
 * Task status/meta presentation for the admin task detail page.
 *
 * - `TaskStatusBadges` — status/priority/archived pills (rendered near the top,
 *   above the alerts; kept here as it's task-state presentation).
 * - `TaskSidebar` — right column of the detail grid: task info + quick stats.
 * Presentational server components.
 */

import { formatDateTimeNumeric, formatDateShort } from '@/lib/date-formats'
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/config/tasks'
import type {
  TaskDetail,
  TaskCompletion,
  TaskAttentionFlag,
  TaskRequestRecord,
} from '@/lib/schemas/tasks'
import { Clock, User, Calendar } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'

export function TaskStatusBadges({ task }: { task: TaskDetail }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
          TASK_STATUS_COLORS[task.current_status] || 'bg-surface-raised text-text-primary'
        }`}
      >
        {TASK_STATUS_LABELS[task.current_status]}
      </span>
      <span
        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
          TASK_PRIORITY_COLORS[task.priority] || 'bg-surface-raised text-text-primary'
        }`}
      >
        {TASK_PRIORITY_LABELS[task.priority]}
      </span>
      {/* Removed the duplicate "Abgeschlossen" badge — task.current_status
          is the SSOT for state; surfacing both `current_status` AND
          `is_completed` creates "which one is the truth?" ambiguity.
          (Per admin UX audit 2026-06-03; the boolean is kept in schema
          for completion-history aggregates.) */}
      {task.is_archived && (
        <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-surface-raised text-text-primary">
          Archiviert
        </span>
      )}
    </div>
  )
}

export function TaskSidebar({
  task,
  completions,
  flags,
  requests,
}: {
  task: TaskDetail
  completions: TaskCompletion[]
  flags: TaskAttentionFlag[]
  requests: TaskRequestRecord[]
}) {
  return (
    <div className="space-y-6">
      {/* Task Info */}
      <div className="bg-surface-base rounded-lg border p-6">
        <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Details</Heading>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-text-tertiary">Erstellt von</dt>
            <dd className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-text-muted" />
              <span className="text-text-primary">
                {task.created_by_name || task.created_by_email || 'Unbekannt'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-tertiary">Zugewiesen an</dt>
            <dd className="flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-text-muted" />
              <span className="text-text-primary">
                {task.assigned_to_name || 'Nicht zugewiesen'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-tertiary">Erstellt am</dt>
            <dd className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-text-muted" />
              <span className="text-text-primary">{formatDateTimeNumeric(task.created_at)}</span>
            </dd>
          </div>
          {task.estimated_minutes && (
            <div>
              <dt className="text-sm text-text-tertiary">Geschätzte Dauer</dt>
              <dd className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">
                  {task.estimated_minutes} Minuten
                </span>
              </dd>
            </div>
          )}
          {task.due_date && (() => {
            const isOverdue = !task.is_completed && new Date(task.due_date) < new Date(new Date().toDateString())
            return (
              <div>
                <dt className="text-sm text-text-tertiary">Fälligkeitsdatum</dt>
                <dd className="flex items-center gap-2 mt-1">
                  <Calendar className={`w-4 h-4 ${isOverdue ? 'text-error-500' : 'text-text-muted'}`} />
                  <span className={isOverdue ? 'text-error-600 font-medium' : 'text-text-primary'}>
                    {formatDateShort(task.due_date)}
                    {isOverdue && ' (überfällig)'}
                  </span>
                </dd>
              </div>
            )
          })()}
          {task.schedule_human && (
            <div>
              <dt className="text-sm text-text-tertiary">Zeitplan</dt>
              <dd className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">{task.schedule_human}</span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface-base rounded-lg border p-6">
        <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">Statistiken</Heading>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-text-secondary">Erledigungen gesamt</span>
            <span className="font-medium text-text-primary">{completions.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Aufmerksamkeits-Flags</span>
            <span className="font-medium text-text-primary">{flags.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Anfragen</span>
            <span className="font-medium text-text-primary">{requests.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
