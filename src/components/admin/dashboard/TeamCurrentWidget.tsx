/**
 * TeamCurrentWidget — "Team aktuell" dashboard section.
 *
 * The team-view companion to PersonalSection (which is self-only). Shows, at a
 * glance, what the rest of the team is on right now: each member's focus
 * headline (or top active task) + open-task count, sorted by who has the most
 * live work. Links to the full "Wer macht was" board for the whole picture.
 *
 * Read-only wiring of existing data — one query, no writes. Excludes the viewer
 * (their own work already sits in PersonalSection directly above this).
 */

import Link from 'next/link'
import { Users, ArrowRight, AlertTriangle } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { focusFreshness } from '@/lib/team/focus-freshness'
import { getTeamCurrent } from '@/lib/dashboard/team-current'

export async function TeamCurrentWidget({ userId }: { userId: string }) {
  const members = await getTeamCurrent(userId)
  if (members.length === 0) return null

  return (
    <section aria-labelledby="team-current-title">
      <div className="flex items-center justify-between">
        <h2
          id="team-current-title"
          className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
        >
          Team aktuell
        </h2>
        <Link
          href="/admin/team/board"
          className="inline-flex items-center gap-1 text-xs font-medium text-action hover:underline"
        >
          Wer macht was
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <ul role="list" className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {members.map((m) => {
          const name = m.display_name || m.user_name || 'Team'
          const fresh = focusFreshness(m.current_focus_updated_at)
          const isStale = Boolean(m.current_focus) && Boolean(fresh?.isStale)
          const line = m.current_focus || m.top_task_title || 'Aktiv'
          return (
            <li key={m.profile_id}>
              <Link
                href={`/admin/team/${m.profile_id}`}
                className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-base p-3 transition-colors hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-action"
              >
                <Avatar src={m.avatar_url} name={name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">{name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-text-tertiary">
                    {isStale && <AlertTriangle className="h-3 w-3 shrink-0 text-warning-500" aria-hidden="true" />}
                    <span className="truncate">{line}</span>
                  </p>
                </div>
                {m.active_task_count > 0 && (
                  <span
                    className="inline-flex shrink-0 items-center gap-1 rounded-full bg-action-muted px-2 py-0.5 text-[11px] font-medium text-action"
                    title={`${m.active_task_count} aktive Aufgaben`}
                  >
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {m.active_task_count}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
