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
import { ArrowLeft, User, Clock, Activity, Edit2, Mail, Calendar, Phone, CheckSquare, Globe } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { adminInteractive } from '@/lib/admin-ui'
import { TeamProfileView } from './TeamProfileView'
import { TeamProfileTimecardsTab } from './TeamProfileTimecardsTab'
import { TeamProfileActivityTab } from './TeamProfileActivityTab'
import { TeamProfileTasksTab } from './TeamProfileTasksTab'
import { TeamLeavePeriodsCard } from './TeamLeavePeriodsCard'
import type { TeamProfileWithUser } from '@/lib/schemas/team'
import { Button } from '@/components/ui/button'
import {
  getDepartmentColor,
  getDepartmentLabel,
  getEmploymentTypeColor,
  getEmploymentTypeLabel,
} from '@/config/team'
import { formatDateShort } from '@/lib/date-formats'

type TabKey = 'uebersicht' | 'aufgaben' | 'zeiterfassung' | 'aktivitaet'

const TAB_KEYS: TabKey[] = ['uebersicht', 'aufgaben', 'zeiterfassung', 'aktivitaet']

interface Props {
  profile: TeamProfileWithUser
  isSuperAdmin: boolean
}

function parseTabKey(value: string | null): TabKey {
  if (value && TAB_KEYS.includes(value as TabKey)) return value as TabKey
  return 'uebersicht'
}

export function TeamProfileTabs({ profile, isSuperAdmin }: Props) {
  const t = useTranslations('admin.team')
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

  const initials = profile.user_name
    ? profile.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : profile.user_email[0].toUpperCase()
  const displayName = profile.user_name || profile.user_email.split('@')[0]

  const tabMeta: Record<TabKey, { label: string; icon: typeof User }> = {
    uebersicht: { label: t('tabs.overview'), icon: User },
    aufgaben: { label: t('tabs.tasks'), icon: CheckSquare },
    zeiterfassung: { label: t('tabs.timecards'), icon: Clock },
    aktivitaet: { label: t('tabs.activity'), icon: Activity },
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-subtle bg-surface-base p-5">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => router.push('/admin/team')}
            className="h-auto px-0 text-sm text-text-secondary hover:bg-transparent hover:text-text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('backToTeam')}
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-full',
              profile.is_active ? adminInteractive.avatarActive : adminInteractive.avatarInactive,
            )}>
              <span className="text-base font-semibold">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-xl font-semibold text-text-primary">{displayName}</h1>
                {!profile.is_active && (
                  <span className="rounded-full bg-surface-overlay px-2 py-0.5 text-xs font-medium text-text-secondary">
                    {t('inactive')}
                  </span>
                )}
              </div>
              {profile.position && (
                <p className="mt-0.5 text-sm text-text-secondary">{profile.position}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-tertiary">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{profile.user_email}</span>
                </span>
                {profile.phone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {profile.phone}
                  </span>
                )}
                {profile.start_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {t('since')} {formatDateShort(profile.start_date)}
                  </span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.department && (
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getDepartmentColor(profile.department))}>
                    {getDepartmentLabel(profile.department)}
                  </span>
                )}
                {profile.employment_type && (
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', getEmploymentTypeColor(profile.employment_type))}>
                    {getEmploymentTypeLabel(profile.employment_type)}
                  </span>
                )}
                {profile.show_on_about && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-action-muted px-2.5 py-1 text-xs font-medium text-action">
                    <Globe className="h-3 w-3" />
                    {t('showOnAbout')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/admin/team/${profile.id}/edit`}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md border border-default px-3 py-1.5 text-sm font-medium text-text-secondary',
              adminInteractive.rowHoverSubtle,
            )}
          >
            <Edit2 className="w-3.5 h-3.5" />
            {t('edit')}
          </Link>
        </div>
      </section>

      {/* Leave periods — hoisted above the tab strip (Z.3) so HR always
          sees who's away regardless of which tab is active. */}
      <TeamLeavePeriodsCard profileId={profile.id} />

      {/* Tab bar */}
      <div className="flex items-center justify-between gap-3 border-b border">
        <nav className="flex -mb-px overflow-x-auto" role="tablist" aria-label="Profilbereiche">
          {TAB_KEYS.map((key) => {
            const meta = tabMeta[key]
            const Icon = meta.icon
            const isActive = tab === key
            return (
              <Button
                key={key}
                type="button"
                variant="ghost"
                onClick={() => goTo(key)}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap h-auto rounded-none',
                  isActive
                    ? 'border-action text-action'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-strong dark:hover:border-white/10',
                )}
              >
                <Icon className="w-4 h-4" />
                {meta.label}
              </Button>
            )
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {tab === 'uebersicht' && (
          <TeamProfileView
            profile={profile}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {tab === 'aufgaben' && (
          <TeamProfileTasksTab userId={profile.user_id} />
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
