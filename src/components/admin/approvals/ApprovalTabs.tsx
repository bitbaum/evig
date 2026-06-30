'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * One Freigaben, tabbed. The admin used to have separate sidebar entries for
 * content approvals ("Freigaben") and timecard approvals ("Zeitkarten-Freigaben");
 * this bar makes them a single approvals area. Add a tab here when a new approval
 * surface is folded in.
 */
const TABS = [
  { href: '/admin/approvals', label: 'Inhalte' },
  { href: '/admin/team/approvals', label: 'Zeitkarten & Abwesenheit' },
] as const

export function ApprovalTabs() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-subtle" aria-label="Freigaben">
      {TABS.map(tab => {
        const active = pathname === tab.href
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
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
