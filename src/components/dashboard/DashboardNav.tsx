'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from '@/i18n/navigation'
import type { DashboardCard } from '@/config/dashboard'

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

  return (
    <nav
      aria-label="Dashboard"
      className="sticky top-16 z-30 hidden border-b border-subtle bg-surface-base/95 backdrop-blur-sm lg:block"
    >
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        {items.map((item) => {
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
      </div>
    </nav>
  )
}
