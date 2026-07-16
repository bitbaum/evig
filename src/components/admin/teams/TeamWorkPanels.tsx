import Link from 'next/link'
import { ClipboardList, FileText, Plus } from 'lucide-react'
import { buttonClass } from '@/components/ui/button-class'
import { ROUTES } from '@/config/routes'
import { TASK_PRIORITY_LABELS, TASK_PRIORITY_COLORS, type TaskPriority } from '@/config/tasks'
import { PROTOCOL_STATUS_LABELS, PROTOCOL_STATUS_COLORS, type ProtocolStatus } from '@/config/protocols'
import { formatDate } from '@/lib/date-formats'
import type { TeamOpenTask, TeamProtocolItem } from '@/lib/services/team-space'

/**
 * The team space work panels: open tasks + recent protocols, side by side.
 * Pure server-rendered lists — creation happens on the existing task/protocol
 * forms, entered with the team preselected via ?team=.
 */

export function TeamTasksPanel({ teamId, tasks, total }: {
  teamId: string
  tasks: TeamOpenTask[]
  total: number
}) {
  return (
    <section className="bg-surface-base rounded-lg border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-text-tertiary" aria-hidden />
          Offene Aufgaben
          {total > 0 && <span className="text-text-tertiary font-normal">({total})</span>}
        </h2>
        <Link
          href={`${ROUTES.admin.taskNew}?team=${teamId}`}
          className={buttonClass({ variant: 'secondary', size: 'sm' })}
        >
          <Plus className="w-4 h-4" />
          Neue Aufgabe
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          Keine offenen Aufgaben — dieses Team hat gerade nichts Pendentes.
        </p>
      ) : (
        <ul className="divide-y divide-subtle">
          {tasks.map((t) => (
            <li key={t.id}>
              <Link
                href={ROUTES.admin.task(t.id)}
                className="flex items-center gap-3 py-2 group"
              >
                <span className="min-w-0 flex-1 text-sm text-text-primary truncate group-hover:underline">
                  {t.title}
                </span>
                {t.assigned_to_name && (
                  <span className="hidden sm:inline text-xs text-text-tertiary truncate max-w-32">
                    {t.assigned_to_name}
                  </span>
                )}
                {t.due_date && (
                  <span className="text-xs text-text-secondary tabular-nums shrink-0">
                    {formatDate(t.due_date)}
                  </span>
                )}
                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TASK_PRIORITY_COLORS[t.priority as TaskPriority] ?? ''}`}>
                  {TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function TeamProtocolsPanel({ teamId, protocols }: {
  teamId: string
  protocols: TeamProtocolItem[]
}) {
  return (
    <section className="bg-surface-base rounded-lg border p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-text-tertiary" aria-hidden />
          Protokolle
        </h2>
        <Link
          href={`${ROUTES.admin.protocolNew}?team=${teamId}`}
          className={buttonClass({ variant: 'secondary', size: 'sm' })}
        >
          <Plus className="w-4 h-4" />
          Neues Protokoll
        </Link>
      </div>

      {protocols.length === 0 ? (
        <p className="text-sm text-text-tertiary">
          Noch keine Protokolle — Sitzungsnotizen landen hier, wenn beim Protokoll dieses Team gewählt ist.
        </p>
      ) : (
        <ul className="divide-y divide-subtle">
          {protocols.map((p) => (
            <li key={p.id}>
              <Link
                href={ROUTES.admin.protocol(p.id)}
                className="flex items-center gap-3 py-2 group"
              >
                <span className="min-w-0 flex-1 text-sm text-text-primary truncate group-hover:underline">
                  {p.title}
                </span>
                <span className="text-xs text-text-secondary tabular-nums shrink-0">
                  {formatDate(p.meeting_date)}
                </span>
                <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${PROTOCOL_STATUS_COLORS[p.status as ProtocolStatus] ?? ''}`}>
                  {PROTOCOL_STATUS_LABELS[p.status as ProtocolStatus] ?? p.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
