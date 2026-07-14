import Link from 'next/link'
import { ClipboardList, AlertTriangle, CircleDot } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { WORK_STATE_LABELS, WORK_STATE_COLORS, type WorkState } from '@/config/team'
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  type TaskStatus,
  type TaskPriority,
} from '@/config/tasks'
import { focusFreshness } from '@/lib/team/focus-freshness'
import { formatDateShort } from '@/lib/date-formats'

export interface BoardTask {
  id: string
  title: string
  current_status: string
  priority: string
  due_date: string | null
}

export interface BoardMemberCard {
  profile_id: string
  user_id: string
  user_name: string | null
  user_email: string
  display_name: string | null
  avatar_url: string | null
  position: string | null
  work_state: string
  current_focus: string | null
  current_focus_updated_at: string | null
  tasks: BoardTask[]
  activeTaskCount: number
  lastActivity: { title: string; occurred_at: string | null } | null
  isStaleFocus: boolean
}

function workStateLabel(state: string): string {
  return WORK_STATE_LABELS[state as WorkState] ?? state
}
function workStateColor(state: string): string {
  return WORK_STATE_COLORS[state as WorkState] ?? WORK_STATE_COLORS.inactive
}

/**
 * One person's board card: identity + work_state, the manual focus headline
 * (with freshness), their live active tasks (ground truth), and last activity.
 * Team context comes from the swimlane it sits in, so the card omits it.
 */
export function MemberBoardCard({ card }: { card: BoardMemberCard }) {
  const name = card.display_name || card.user_name || card.user_email
  const fresh = focusFreshness(card.current_focus_updated_at)

  return (
    <Link
      href={`/admin/team/${card.profile_id}`}
      className="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-surface-base p-5 transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-800"
    >
      {/* Header: identity + state */}
      <div className="flex items-start gap-3">
        <Avatar src={card.avatar_url} name={name} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-text-primary">{name}</p>
          {card.position && <p className="truncate text-xs text-text-tertiary">{card.position}</p>}
        </div>
        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${workStateColor(card.work_state)}`}>
          {workStateLabel(card.work_state)}
        </span>
      </div>

      {/* Focus headline + freshness */}
      <div className="min-w-0">
        {card.current_focus ? (
          <>
            <p className="text-sm text-text-primary">{card.current_focus}</p>
            {fresh && (
              <span
                className={
                  card.isStaleFocus
                    ? 'mt-1 inline-flex items-center gap-1 rounded-full bg-warning-100 px-2 py-0.5 text-[11px] font-medium text-warning-800 dark:bg-warning-900/30 dark:text-warning-300'
                    : 'mt-1 inline-flex items-center gap-1 text-[11px] text-text-tertiary'
                }
              >
                {card.isStaleFocus && <AlertTriangle className="h-3 w-3" />}
                Fokus {fresh.label}
              </span>
            )}
          </>
        ) : (
          <p className="text-sm italic text-text-tertiary">Kein Fokus gesetzt</p>
        )}
      </div>

      {/* Active tasks (ground truth) */}
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          <ClipboardList className="h-3 w-3" />
          {card.activeTaskCount > 0 ? `${card.activeTaskCount} aktive Aufgaben` : 'Keine offenen Aufgaben'}
        </div>
        {card.tasks.slice(0, 2).map((t) => (
          <div key={t.id} className="flex items-center gap-2 py-0.5">
            <span
              className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${TASK_PRIORITY_COLORS[t.priority as TaskPriority] ?? ''}`}
              title={`Priorität: ${TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}`}
            >
              {TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">{t.title}</span>
            <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${TASK_STATUS_COLORS[t.current_status as TaskStatus] ?? ''}`}>
              {TASK_STATUS_LABELS[t.current_status as TaskStatus] ?? t.current_status}
            </span>
          </div>
        ))}
        {card.activeTaskCount > 2 && (
          <p className="mt-0.5 text-[11px] text-text-tertiary">+{card.activeTaskCount - 2} weitere</p>
        )}
      </div>

      {/* Last activity */}
      {card.lastActivity && (
        <div className="mt-auto flex items-center gap-1.5 border-t border-subtle pt-3 text-[11px] text-text-tertiary">
          <CircleDot className="h-3 w-3" />
          <span className="min-w-0 flex-1 truncate">{card.lastActivity.title}</span>
          {card.lastActivity.occurred_at && (
            <span className="shrink-0">{formatDateShort(card.lastActivity.occurred_at)}</span>
          )}
        </div>
      )}
    </Link>
  )
}
