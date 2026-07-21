'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

/**
 * People & Teams are one area seen through three lenses — the individual
 * people (Mitarbeitende, /admin/team), the organizational groups they belong
 * to (Teams, /admin/teams), and who is doing what right now (Wer macht was,
 * /admin/team/board). Those three routes are one URL-letter apart and used to
 * live in separate sidebar groups with confusingly similar labels; this bar
 * makes the relationship explicit and lets you switch between them in one
 * click, from any of the three pages. Mirrors ApprovalTabs.
 *
 * Active state is prefix-aware so detail pages keep their tab lit — but note
 * `/admin/team` is a prefix of `/admin/teams`, so Teams and Board are matched
 * first and People only when neither of those claims the path.
 */
const TABS = [
  { href: '/admin/team', labelKey: 'people' },
  { href: '/admin/teams', labelKey: 'teams' },
  { href: '/admin/team/board', labelKey: 'board' },
] as const

function isTabActive(href: string, pathname: string): boolean {
  const under = (base: string) => pathname === base || pathname.startsWith(base + '/')
  const isTeams = under('/admin/teams')
  const isBoard = under('/admin/team/board')
  if (href === '/admin/teams') return isTeams
  if (href === '/admin/team/board') return isBoard
  // People: any /admin/team* that isn't Teams or the Board.
  return !isTeams && !isBoard && under('/admin/team')
}

export function PeopleTeamsTabs() {
  const t = useTranslations('admin.team.orgTabs')
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-subtle" aria-label={t('aria')}>
      {TABS.map(tab => {
        const active = isTabActive(tab.href, pathname)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'border-primary-600 text-text-primary'
                : 'border-transparent text-text-tertiary hover:border-subtle hover:text-text-secondary',
            )}
          >
            {t(tab.labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
