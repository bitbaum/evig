/**
 * Task list table — admin/tasks presentation.
 *
 * Server component (no client interactivity beyond Link navigation).
 * Extracted from page.tsx for SoC.
 */

import Link from 'next/link'
import { AlertTriangle, ClipboardList, Plus } from 'lucide-react'
import { buttonClass } from '@/components/ui/button-class'
import { ROUTES } from '@/config/routes'
import { formatDateShort } from '@/lib/date-formats'
import {
  TASK_CATEGORY_LABELS,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_TYPE_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_COLORS,
} from '@/config/tasks'
import { ADMIN_CONTENT } from '@/config/admin-content'
import Heading from '@/components/admin/AdminHeading'
import { AdminTable, type AdminTableColumn } from '@/components/admin/AdminTable'
import type { TaskListItem } from '@/lib/schemas/tasks'

const CHIP_CLASS = 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full'

interface Props {
  tasks: TaskListItem[]
  hasError: boolean
}

const columns: AdminTableColumn<TaskListItem>[] = [
  {
    header: 'Aufgabe',
    className: 'max-w-[200px] sm:max-w-xs',
    cell: (task) => (
      <>
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={ROUTES.admin.task(task.id)}
            className="font-medium text-text-primary hover:text-action truncate min-w-0 focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-1 rounded-sm"
          >
            {task.title}
          </Link>
          <OpenRequestSignal task={task} />
        </div>
        {task.description && (
          <p className="text-sm text-text-tertiary truncate max-w-full">{task.description}</p>
        )}
      </>
    ),
  },
  {
    header: 'Kategorie',
    className: 'hidden sm:table-cell whitespace-nowrap',
    cell: (task) => <span className="text-sm text-text-secondary">{TASK_CATEGORY_LABELS[task.category]}</span>,
  },
  {
    header: 'Status',
    className: 'whitespace-nowrap',
    cell: (task) => (
      <span className={`${CHIP_CLASS} ${TASK_STATUS_COLORS[task.current_status] || 'bg-surface-raised text-text-primary'}`}>
        {TASK_STATUS_LABELS[task.current_status]}
      </span>
    ),
  },
  {
    header: 'Priorität',
    className: 'whitespace-nowrap',
    cell: (task) => (
      <span className={`${CHIP_CLASS} ${TASK_PRIORITY_COLORS[task.priority] || 'bg-surface-raised text-text-primary'}`}>
        {TASK_PRIORITY_LABELS[task.priority]}
      </span>
    ),
  },
  {
    header: 'Zeitplan',
    className: 'hidden md:table-cell whitespace-nowrap',
    cell: (task) => (
      <span className="text-sm text-text-secondary">
        {task.schedule_human || TASK_TYPE_LABELS[task.task_type]}
      </span>
    ),
  },
  {
    header: 'Zugewiesen',
    className: 'hidden md:table-cell whitespace-nowrap',
    cell: (task) =>
      task.assigned_to_name
        ? <span className="text-sm text-text-secondary">{task.assigned_to_name}</span>
        : <span className="text-sm text-text-muted">&mdash;</span>,
  },
  {
    header: 'Fällig',
    className: 'hidden sm:table-cell whitespace-nowrap',
    cell: (task) => <DueDateCell task={task} />,
  },
  {
    header: 'Erledigungen',
    className: 'hidden sm:table-cell text-right whitespace-nowrap',
    cell: (task) => <span className="text-sm text-text-secondary">{task.completion_count}</span>,
  },
]

export function TaskTable({ tasks, hasError }: Props) {
  if (hasError) return <ErrorPanel />
  if (tasks.length === 0) return <EmptyPanel />

  return <AdminTable columns={columns} rows={tasks} rowKey={(task) => task.id} />
}

/**
 * 📢 = broadcast (any-staff can take), 👤 = targeted (single-user).
 * Broadcast outranks targeted when both flags are set.
 */
function OpenRequestSignal({ task }: { task: TaskListItem }) {
  if (task.has_open_broadcast) {
    return (
      <span
        className="inline-flex shrink-0 items-center text-xs"
        aria-label={`${task.open_request_count} offene Broadcast-Anfrage(n)`}
        title={`${task.open_request_count} offene Anfrage(n) — Broadcast`}
      >📢</span>
    )
  }
  if (task.open_request_count > 0) {
    return (
      <span
        className="inline-flex shrink-0 items-center text-xs"
        aria-label={`${task.open_request_count} offene gezielte Anfrage(n)`}
        title={`${task.open_request_count} offene Anfrage(n) — gezielt`}
      >👤</span>
    )
  }
  return null
}

function DueDateCell({ task }: { task: TaskListItem }) {
  if (!task.due_date) {
    return <span className="text-sm text-text-muted">—</span>
  }
  const isOverdue = !task.is_completed && new Date(task.due_date) < new Date(new Date().toDateString())
  return (
    <span className={`text-sm ${isOverdue ? 'text-error-600 font-medium' : 'text-text-secondary'}`}>
      {formatDateShort(task.due_date)}
      {isOverdue && ' (überfällig)'}
    </span>
  )
}

function ErrorPanel() {
  return (
    <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
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
  )
}

function EmptyPanel() {
  return (
    <div className="rounded-lg border border-default bg-surface-base p-12 text-center">
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
  )
}
