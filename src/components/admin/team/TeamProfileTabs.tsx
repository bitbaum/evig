'use client'

/**
 * TeamProfileTabs — Phase 3 of the team + timecards rebuild.
 *
 * Wraps the existing TeamProfileView in a tab shell so HR can see a
 * person's profile, their timecards, and their activity in one place
 * without context-switching to /admin/timecards or /admin/team/activity.
 * The Bearbeiten action stays as a link to the existing edit page —
 * a full inline edit experience is a Phase 4 concern (it needs the
 * compensation + leave_periods schema work to land first).
 *
 * Tab state lives in the URL via a `tab` query param so deep-linking
 * to a specific tab works ("send the new HR person this link to see
 * Maria's hours"). Defaults to overview.
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { User, Clock, Activity, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TeamProfileView } from './TeamProfileView'
import { TeamProfileTimecardsTab } from './TeamProfileTimecardsTab'
import { TeamProfileActivityTab } from './TeamProfileActivityTab'
import { TeamLeavePeriodsCard } from './TeamLeavePeriodsCard'
import type { TeamProfileWithUser } from '@/lib/schemas/team'

type TabKey = 'uebersicht' | 'zeiterfassung' | 'aktivitaet'

const TABS: Array<{ key: TabKey; label: string; icon: typeof User }> = [
  { key: 'uebersicht', label: 'Überblick', icon: User },
  { key: 'zeiterfassung', label: 'Zeiterfassung', icon: Clock },
  { key: 'aktivitaet', label: 'Aktivität', icon: Activity },
]

interface Props {
  profile: TeamProfileWithUser
  isSuperAdmin: boolean
}

function parseTabKey(value: string | null): TabKey {
  if (value === 'zeiterfassung' || value === 'aktivitaet') return value
  return 'uebersicht'
}

export function TeamProfileTabs({ profile, isSuperAdmin }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabKey>(() => parseTabKey(searchParams?.get('tab') ?? null))

  // Sync URL ?tab=... when the user clicks a tab. shallow replace — no scroll jump.
  const goTo = useCallback((next: TabKey) => {
    setTab(next)
    const params = new URLSearchParams(searchParams?.toString() ?? '')
    if (next === 'uebersicht') params.delete('tab')
    else params.set('tab', next)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [router, pathname, searchParams])

  // Keep tab state in sync if user uses browser back/forward to a different ?tab.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const fromUrl = parseTabKey(searchParams?.get('tab') ?? null)
    if (fromUrl !== tab) setTab(fromUrl)
  }, [searchParams, tab])
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-4">
      {/* Leave periods — hoisted above the tab strip (Z.3) so HR always
          sees who's away regardless of which tab is active. */}
      <TeamLeavePeriodsCard profileId={profile.id} />

      {/* Tab bar */}
      <div className="flex items-center justify-between gap-3 border-b border">
        <nav className="flex -mb-px overflow-x-auto" role="tablist" aria-label="Profilbereiche">
          {TABS.map(t => {
            const Icon = t.icon
            const isActive = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => goTo(t.key)}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  isActive
                    ? 'border-action text-action'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-strong dark:hover:border-white/10',
                )}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </nav>
        <Link
          href={`/admin/team/${profile.id}/edit`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-default text-sm font-medium text-text-secondary hover:bg-surface-raised dark:hover:bg-surface-base/4 whitespace-nowrap"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Bearbeiten</span>
        </Link>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {tab === 'uebersicht' && (
          <TeamProfileView
            profile={profile}
            isSuperAdmin={isSuperAdmin}
            onBack={() => router.push('/admin/team')}
          />
        )}
        {tab === 'zeiterfassung' && (
          <TeamProfileTimecardsTab userId={profile.user_id} />
        )}
        {tab === 'aktivitaet' && (
          <TeamProfileActivityTab userId={profile.user_id} />
        )}
      </div>
    </div>
  )
}
