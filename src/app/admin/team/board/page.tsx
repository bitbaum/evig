/**
 * Team Board — "Wer macht was"
 *
 * The one screen that answers "what is X working on?" for the whole team at
 * once, now grouped into per-team swimlanes. Read-only wiring of data that
 * already exists: each active staff member shown with their manual focus
 * headline (+ freshness), their live active tasks (ground truth — accurate even
 * when the headline goes stale), and their last team-visible activity.
 *
 * A person on several teams appears in several lanes; the board-level stats
 * count each person once. Non-sensitive by design: readable by any staff member
 * (transparency is the point). Drilling into a member's full profile stays gated
 * behind the sensitive `team` section — HR/compensation never leaks here.
 */

import { Metadata } from 'next'
import { PeopleTeamsTabs } from '@/components/admin/team/PeopleTeamsTabs'
import Link from 'next/link'
import { Users, ClipboardList, Activity, AlertTriangle, UserRound } from 'lucide-react'
import { requireSection } from '@/lib/admin/guards'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsStrip, type StatItem } from '@/components/admin/AdminStatsStrip'
import { MemberBoardCard, type BoardMemberCard } from '@/components/admin/team/MemberBoardCard'
import { WORK_STATE_LABELS, WORK_STATE_OPTIONS, type WorkState } from '@/config/team'
import { getAccentClasses } from '@/config/teams'
import { listTeams } from '@/lib/services/teams'
import { focusFreshness, FOCUS_STALE_DAYS } from '@/lib/team/focus-freshness'

export const metadata: Metadata = {
  title: 'Wer macht was | Team',
  description: 'Aktueller Fokus und Aufgaben des Teams auf einen Blick.',
}

// --- Row shapes from the read queries -------------------------------------

interface MemberRow {
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

const WORK_STATE_RANK: Record<string, number> = { active: 0, on_leave: 1, unavailable: 2, inactive: 3 }
const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }

async function getMembers(): Promise<MemberRow[]> {
  try {
    const { rows } = await query<MemberRow>(
      `SELECT
         tp.id AS profile_id, tp.user_id,
         u.name AS user_name, u.email AS user_email,
         up.display_name, up.avatar_url,
         tp.position, tp.work_state, tp.current_focus, tp.current_focus_updated_at
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
    const { rows } = await query<TaskRow>(
      `SELECT assigned_to AS user_id, id, title, current_status, priority, due_date
       FROM ${TABLE_NAMES.TASKS}
       WHERE assigned_to IS NOT NULL AND is_completed = false AND is_archived = false AND current_status <> 'idle'`
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

async function getMemberships(): Promise<{ user_id: string; team_id: string }[]> {
  try {
    const { rows } = await query<{ user_id: string; team_id: string }>(
      `SELECT user_id, team_id FROM ${TABLE_NAMES.TEAM_MEMBERSHIPS} WHERE left_at IS NULL`
    )
    return rows
  } catch (error) {
    logger.error('Team board: failed to load memberships', { error })
    return []
  }
}

// --- Filters ---------------------------------------------------------------

interface BoardFilters { team?: string; state?: string; focus?: string }

function buildHref(current: BoardFilters, patch: BoardFilters): string {
  const next = { ...current, ...patch }
  const params = new URLSearchParams()
  if (next.team) params.set('team', next.team)
  if (next.state) params.set('state', next.state)
  if (next.focus) params.set('focus', next.focus)
  const qs = params.toString()
  return qs ? `/admin/team/board?${qs}` : '/admin/team/board'
}

function sortCards(cards: BoardMemberCard[]): BoardMemberCard[] {
  return cards.slice().sort((a, b) => {
    const sr = (WORK_STATE_RANK[a.work_state] ?? 9) - (WORK_STATE_RANK[b.work_state] ?? 9)
    if (sr !== 0) return sr
    if (b.activeTaskCount !== a.activeTaskCount) return b.activeTaskCount - a.activeTaskCount
    const an = (a.display_name || a.user_name || a.user_email).toLowerCase()
    const bn = (b.display_name || b.user_name || b.user_email).toLowerCase()
    return an.localeCompare(bn)
  })
}

interface PageProps {
  searchParams: Promise<{ team?: string; state?: string; focus?: string }>
}

export default async function TeamBoardPage({ searchParams }: PageProps) {
  await requireSection('team-board')
  const filters = await searchParams

  const [members, tasks, activity, memberships, teams] = await Promise.all([
    getMembers(),
    getActiveTasks(),
    getLatestActivity(),
    getMemberships(),
    listTeams(),
  ])

  // Group tasks + activity by user (one pass each, no N+1).
  const tasksByUser = new Map<string, TaskRow[]>()
  for (const task of tasks) {
    const list = tasksByUser.get(task.user_id) ?? []
    list.push(task)
    tasksByUser.set(task.user_id, list)
  }
  const activityByUser = new Map<string, ActivityRow>()
  for (const row of activity) if (!activityByUser.has(row.user_id)) activityByUser.set(row.user_id, row)

  // Which live teams each user belongs to.
  const teamsByUser = new Map<string, string[]>()
  for (const m of memberships) {
    const arr = teamsByUser.get(m.user_id) ?? []
    arr.push(m.team_id)
    teamsByUser.set(m.user_id, arr)
  }

  // One card per person (unique) — stats count each person once.
  const cards: BoardMemberCard[] = members.map((m) => {
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

  // Board-level stats (whole team, each person once).
  const stats = {
    activeMembers: cards.length,
    withTasks: cards.filter((c) => c.activeTaskCount > 0).length,
    staleFocus: cards.filter((c) => c.isStaleFocus).length,
    totalTasks: tasks.length,
  }

  // Filter by state/focus, then group into per-team swimlanes.
  let filtered = cards
  if (filters.state) filtered = filtered.filter((c) => c.work_state === filters.state)
  if (filters.focus === 'stale') filtered = filtered.filter((c) => c.isStaleFocus)

  const cardsForTeam = (teamId: string) =>
    sortCards(filtered.filter((c) => (teamsByUser.get(c.user_id) ?? []).includes(teamId)))
  const ohneTeam = sortCards(filtered.filter((c) => (teamsByUser.get(c.user_id) ?? []).length === 0))

  const lanes = teams
    .filter((t) => !filters.team || t.id === filters.team)
    .map((t) => ({ id: t.id, name: t.name, accent: t.accent, cards: cardsForTeam(t.id) }))
  const showOhne = !filters.team && ohneTeam.length > 0

  const hasFilters = Boolean(filters.team || filters.state || filters.focus)
  const totalVisible = lanes.reduce((n, l) => n + l.cards.length, 0) + (showOhne ? ohneTeam.length : 0)

  return (
    <AdminPageWrapper
      title="Wer macht was"
      description="Aktueller Fokus und Aufgaben des Teams auf einen Blick — nach Team gruppiert."
      icon={Users}
      iconColor="blue"
    >
      <PeopleTeamsTabs />

      <AdminStatsStrip
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
        ] satisfies StatItem[]}
      />

      {/* Filter bar — server-side via search params, no client JS. */}
      <div className="flex flex-col gap-3">
        <FilterRow label="Team">
          <FilterChip href={buildHref(filters, { team: undefined })} active={!filters.team}>Alle</FilterChip>
          {teams.map((t) => (
            <FilterChip
              key={t.id}
              href={buildHref(filters, { team: filters.team === t.id ? undefined : t.id })}
              active={filters.team === t.id}
            >
              {t.name}
            </FilterChip>
          ))}
        </FilterRow>
        <FilterRow label="Status">
          <FilterChip href={buildHref(filters, { state: undefined })} active={!filters.state}>Alle</FilterChip>
          {WORK_STATE_OPTIONS.map((s) => (
            <FilterChip
              key={s}
              href={buildHref(filters, { state: filters.state === s ? undefined : s })}
              active={filters.state === s}
            >
              {WORK_STATE_LABELS[s as WorkState] ?? s}
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

      {totalVisible === 0 ? (
        <div className="rounded-lg border border-subtle bg-surface-base p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-text-tertiary" />
          <p className="mt-3 text-sm text-text-secondary">
            {hasFilters ? 'Keine Mitglieder passen zu diesen Filtern.' : 'Noch keine aktiven Team-Profile.'}
          </p>
          {hasFilters && (
            <Link href="/admin/team/board" className="mt-3 inline-block text-sm font-medium text-primary-700 hover:underline dark:text-primary-400">
              Filter zurücksetzen
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {lanes.map((lane) => (
            <Swimlane
              key={lane.id}
              title={lane.name}
              accentClass={getAccentClasses(lane.accent)}
              count={lane.cards.length}
              cards={lane.cards}
            />
          ))}
          {showOhne && (
            <Swimlane
              title="Ohne Team"
              accentClass="bg-surface-raised text-text-tertiary"
              icon
              count={ohneTeam.length}
              cards={ohneTeam}
            />
          )}
        </div>
      )}

      <p className="border-t border-subtle pt-6 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">
        Fokus gilt nach {FOCUS_STALE_DAYS} Tagen als veraltet · Aufgaben sind Live-Daten aus «Aufgaben»
      </p>
    </AdminPageWrapper>
  )
}

// --- Presentational pieces (co-located) ------------------------------------

function Swimlane({
  title,
  accentClass,
  count,
  cards,
  icon,
}: {
  title: string
  accentClass: string
  count: number
  cards: BoardMemberCard[]
  icon?: boolean
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${accentClass}`}>
          {icon && <UserRound className="h-3 w-3" />}
          {title}
        </span>
        <span className="text-xs text-text-tertiary tabular-nums">{count}</span>
      </div>
      {cards.length === 0 ? (
        <p className="rounded-lg border border-subtle bg-surface-base px-4 py-6 text-center text-xs text-text-tertiary">
          Niemand passt hier zu den Filtern.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <MemberBoardCard key={`${title}-${c.profile_id}`} card={c} />
          ))}
        </div>
      )}
    </section>
  )
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">{label}</span>
      {children}
    </div>
  )
}

function FilterChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
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
