/**
 * Team Board — "Wer macht was"
 *
 * The one screen that answers "what is X working on?" for the whole team at
 * once. Read-only wiring of data that already exists: each active staff member
 * shown with their manual focus headline (+ freshness), their live active tasks
 * (ground truth — accurate even when the headline goes stale), and their last
 * team-visible activity.
 *
 * Non-sensitive by design: readable by any staff member (transparency is the
 * point). Drilling into a member's full profile stays gated behind the
 * sensitive `team` section — HR/compensation never leaks onto this board.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Users, ClipboardList, Activity, AlertTriangle, CircleDot } from 'lucide-react'
import { requireSection } from '@/lib/admin/guards'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { Avatar } from '@/components/ui/Avatar'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
import {
  WORK_STATE_LABELS,
  WORK_STATE_COLORS,
  WORK_STATE_OPTIONS,
  DEPARTMENT_LABELS,
  DEPARTMENT_COLORS,
  DEPARTMENT_OPTIONS,
  type WorkState,
} from '@/config/team'
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  type TaskStatus,
  type TaskPriority,
} from '@/config/tasks'
import { focusFreshness, FOCUS_STALE_DAYS } from '@/lib/team/focus-freshness'
import { formatDateShort } from '@/lib/date-formats'

export const metadata: Metadata = {
  title: 'Wer macht was | Team',
  description: 'Aktueller Fokus und Aufgaben des Teams auf einen Blick.',
}

// --- Row shapes from the three read queries -------------------------------

interface MemberRow {
  profile_id: string
  user_id: string
  user_name: string | null
  user_email: string
  display_name: string | null
  avatar_url: string | null
  position: string | null
  department: string | null
  work_state: string
  current_focus: string | null
  current_focus_updated_at: string | null
}

interface TaskRow {
  user_id: string
  id: string
  title: string
  current_status: string
  priority: string
  due_date: string | null
}

interface ActivityRow {
  user_id: string
  title: string
  occurred_at: string | null
}

const WORK_STATE_RANK: Record<string, number> = {
  active: 0,
  on_leave: 1,
  unavailable: 2,
  inactive: 3,
}

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

async function getMembers(): Promise<MemberRow[]> {
  try {
    const { rows } = await query<MemberRow>(
      `SELECT
         tp.id AS profile_id,
         tp.user_id,
         u.name AS user_name,
         u.email AS user_email,
         up.display_name,
         up.avatar_url,
         tp.position,
         tp.department,
         tp.work_state,
         tp.current_focus,
         tp.current_focus_updated_at
       FROM ${TABLE_NAMES.TEAM_PROFILES} tp
       JOIN ${TABLE_NAMES.USERS} u ON tp.user_id = u.id
       LEFT JOIN ${TABLE_NAMES.USER_PROFILES} up ON up.user_id = tp.user_id
       WHERE tp.is_active = true`
    )
    return rows
  } catch (error) {
    logger.error('Team board: failed to load members', { error })
    return []
  }
}

async function getActiveTasks(): Promise<TaskRow[]> {
  try {
    // Ground truth: open, non-idle tasks that are actually assigned to someone.
    const { rows } = await query<TaskRow>(
      `SELECT assigned_to AS user_id, id, title, current_status, priority, due_date
       FROM ${TABLE_NAMES.TASKS}
       WHERE assigned_to IS NOT NULL
         AND is_completed = false
         AND is_archived = false
         AND current_status <> 'idle'`
    )
    return rows
  } catch (error) {
    logger.error('Team board: failed to load active tasks', { error })
    return []
  }
}

async function getLatestActivity(): Promise<ActivityRow[]> {
  try {
    const { rows } = await query<ActivityRow>(
      `SELECT DISTINCT ON (user_id) user_id, title, occurred_at
       FROM ${TABLE_NAMES.ACTIVITY_UPDATES}
       WHERE visibility IN ('team', 'department', 'public')
       ORDER BY user_id, occurred_at DESC NULLS LAST`
    )
    return rows
  } catch (error) {
    logger.error('Team board: failed to load latest activity', { error })
    return []
  }
}

// --- Assembled per-member view --------------------------------------------

interface MemberCard extends MemberRow {
  tasks: TaskRow[]
  activeTaskCount: number
  lastActivity: ActivityRow | null
  isStaleFocus: boolean
}

function workStateLabel(state: string): string {
  return WORK_STATE_LABELS[state as WorkState] ?? state
}
function workStateColor(state: string): string {
  return WORK_STATE_COLORS[state as WorkState] ?? WORK_STATE_COLORS.inactive
}
function departmentLabel(dept: string | null): string | null {
  if (!dept) return null
  return DEPARTMENT_LABELS[dept as keyof typeof DEPARTMENT_LABELS] ?? dept
}
function departmentColor(dept: string | null): string {
  if (!dept) return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
  return DEPARTMENT_COLORS[dept as keyof typeof DEPARTMENT_COLORS]
    ?? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
}

interface BoardFilters {
  dept?: string
  state?: string
  focus?: string
}

function buildHref(current: BoardFilters, patch: BoardFilters): string {
  const next = { ...current, ...patch }
  const params = new URLSearchParams()
  if (next.dept) params.set('dept', next.dept)
  if (next.state) params.set('state', next.state)
  if (next.focus) params.set('focus', next.focus)
  const qs = params.toString()
  return qs ? `/admin/team/board?${qs}` : '/admin/team/board'
}

interface PageProps {
  searchParams: Promise<{ dept?: string; state?: string; focus?: string }>
}

export default async function TeamBoardPage({ searchParams }: PageProps) {
  await requireSection('team-board')
  const filters = await searchParams

  const [members, tasks, activity] = await Promise.all([
    getMembers(),
    getActiveTasks(),
    getLatestActivity(),
  ])

  // Group tasks + activity by user (no N+1 — one pass each).
  const tasksByUser = new Map<string, TaskRow[]>()
  for (const task of tasks) {
    const list = tasksByUser.get(task.user_id) ?? []
    list.push(task)
    tasksByUser.set(task.user_id, list)
  }
  const activityByUser = new Map<string, ActivityRow>()
  for (const row of activity) {
    if (!activityByUser.has(row.user_id)) activityByUser.set(row.user_id, row)
  }

  const cards: MemberCard[] = members.map((m) => {
    const userTasks = (tasksByUser.get(m.user_id) ?? []).slice().sort((a, b) => {
      const pr = (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
      if (pr !== 0) return pr
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return 0
    })
    const fresh = focusFreshness(m.current_focus_updated_at)
    return {
      ...m,
      tasks: userTasks,
      activeTaskCount: userTasks.length,
      lastActivity: activityByUser.get(m.user_id) ?? null,
      isStaleFocus: Boolean(m.current_focus) && Boolean(fresh?.isStale),
    }
  })

  // Board-level stats (computed before filtering — they describe the whole team).
  const stats = {
    activeMembers: cards.length,
    withTasks: cards.filter((c) => c.activeTaskCount > 0).length,
    staleFocus: cards.filter((c) => c.isStaleFocus).length,
    totalTasks: tasks.length,
  }

  // Apply filters.
  let visible = cards
  if (filters.dept) visible = visible.filter((c) => c.department === filters.dept)
  if (filters.state) visible = visible.filter((c) => c.work_state === filters.state)
  if (filters.focus === 'stale') visible = visible.filter((c) => c.isStaleFocus)

  // Sort: available first, then those with the most active work, then by name.
  visible = visible.slice().sort((a, b) => {
    const sr = (WORK_STATE_RANK[a.work_state] ?? 9) - (WORK_STATE_RANK[b.work_state] ?? 9)
    if (sr !== 0) return sr
    if (b.activeTaskCount !== a.activeTaskCount) return b.activeTaskCount - a.activeTaskCount
    const an = (a.display_name || a.user_name || a.user_email).toLowerCase()
    const bn = (b.display_name || b.user_name || b.user_email).toLowerCase()
    return an.localeCompare(bn)
  })

  const hasFilters = Boolean(filters.dept || filters.state || filters.focus)
  const presentDepartments = DEPARTMENT_OPTIONS.filter((d) =>
    cards.some((c) => c.department === d)
  )

  return (
    <AdminPageWrapper
      title="Wer macht was"
      description="Aktueller Fokus und Aufgaben des Teams auf einen Blick — die Frage, was jemand gerade macht, beantwortet sich hier von selbst."
      icon={Users}
      iconColor="blue"
    >
      <AdminStatsGrid
        items={[
          { icon: Users, color: 'blue', label: 'Aktive Mitglieder', value: stats.activeMembers },
          { icon: ClipboardList, color: 'green', label: 'Mit offenen Aufgaben', value: stats.withTasks },
          { icon: Activity, color: 'purple', label: 'Offene Aufgaben', value: stats.totalTasks },
          {
            icon: AlertTriangle,
            color: 'orange',
            label: 'Fokus veraltet',
            value: stats.staleFocus,
            href: stats.staleFocus > 0 ? buildHref({}, { focus: 'stale' }) : undefined,
          },
        ] satisfies StatCardItem[]}
      />

      {/* Filter bar — server-side via search params, no client JS. */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Abteilung">
          <FilterChip href={buildHref(filters, { dept: undefined })} active={!filters.dept}>
            Alle
          </FilterChip>
          {presentDepartments.map((d) => (
            <FilterChip
              key={d}
              href={buildHref(filters, { dept: filters.dept === d ? undefined : d })}
              active={filters.dept === d}
            >
              {departmentLabel(d)}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Status">
          <FilterChip href={buildHref(filters, { state: undefined })} active={!filters.state}>
            Alle
          </FilterChip>
          {WORK_STATE_OPTIONS.map((s) => (
            <FilterChip
              key={s}
              href={buildHref(filters, { state: filters.state === s ? undefined : s })}
              active={filters.state === s}
            >
              {workStateLabel(s)}
            </FilterChip>
          ))}
          <FilterChip
            href={buildHref(filters, { focus: filters.focus === 'stale' ? undefined : 'stale' })}
            active={filters.focus === 'stale'}
          >
            Fokus veraltet
          </FilterChip>
        </FilterRow>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-subtle bg-surface-base p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-text-tertiary" />
          <p className="mt-3 text-sm text-text-secondary">
            {hasFilters
              ? 'Keine Mitglieder passen zu diesen Filtern.'
              : 'Noch keine aktiven Team-Profile. Lege unter Team-Profile welche an.'}
          </p>
          {hasFilters && (
            <Link
              href="/admin/team/board"
              className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              Filter zurücksetzen
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((c) => (
            <MemberBoardCard key={c.profile_id} card={c} />
          ))}
        </div>
      )}

      <p className="border-t border-subtle pt-6 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">
        Fokus gilt nach {FOCUS_STALE_DAYS} Tagen als veraltet · Aufgaben sind Live-Daten aus «Aufgaben»
      </p>
    </AdminPageWrapper>
  )
}

// --- Presentational pieces (co-located, board-only) ------------------------

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
        {label}
      </span>
      {children}
    </div>
  )
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? 'inline-flex items-center rounded-full border border-primary-600 bg-primary-600 px-3 py-1 text-xs font-medium text-white'
          : 'inline-flex items-center rounded-full border border-subtle bg-surface-base px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:border-neutral-300 hover:text-text-primary'
      }
    >
      {children}
    </Link>
  )
}

function MemberBoardCard({ card }: { card: MemberCard }) {
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
          <p className="truncate text-xs text-text-tertiary">
            {[card.position, departmentLabel(card.department)].filter(Boolean).join(' · ') || 'Team'}
          </p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${workStateColor(card.work_state)}`}
        >
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
              className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                TASK_PRIORITY_COLORS[t.priority as TaskPriority] ?? ''
              }`}
              title={`Priorität: ${TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}`}
            >
              {TASK_PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">{t.title}</span>
            <span
              className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                TASK_STATUS_COLORS[t.current_status as TaskStatus] ?? ''
              }`}
            >
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
