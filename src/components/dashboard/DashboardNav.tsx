'use client'

import { Fragment } from 'react'
import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import { DASHBOARD_CATEGORIES, type DashboardCard, type DashboardCategory } from '@/config/dashboard'

interface DashboardNavProps {
  items: DashboardCard[]
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname()

  if (items.length === 0) return null

  // Chunk the strip by the same category SSOT the home page uses, so it reads as
  // organised groups (Konto · Aktivitäten · …) instead of one flat wall of links.
  const order = (Object.keys(DASHBOARD_CATEGORIES) as DashboardCategory[]).sort(
    (a, b) => DASHBOARD_CATEGORIES[a].priority - DASHBOARD_CATEGORIES[b].priority,
  )
  const groups = order
    .map(category => ({ category, groupItems: items.filter(item => item.category === category) }))
    .filter(group => group.groupItems.length > 0)

  return (
    <nav
      aria-label="Dashboard"
      className="sticky top-16 z-30 hidden border-b border-subtle bg-surface-base/95 backdrop-blur-sm lg:block"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {groups.map((group, index) => (
          <Fragment key={group.category}>
            {index > 0 && <span aria-hidden="true" className="mx-2 h-5 w-px shrink-0 bg-subtle" />}
            {group.groupItems.map(item => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-action-muted text-action'
                      : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary'
                  }`}
                >
                  <span aria-hidden="true" className="mr-1.5">{item.icon}</span>
                  {item.title}
                </Link>
              )
            })}
          </Fragment>
        ))}
      </div>
    </nav>
  )
}
