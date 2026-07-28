'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { navLinkClass } from '@/lib/design/nav'
import { PiggyBank, TrendingUp, Target, Eye } from 'lucide-react'

const TABS = [
  { href: '/admin/analyse/finanzen', label: 'Finanzen', icon: PiggyBank },
  { href: '/admin/analyse/kennzahlen', label: 'Kennzahlen', icon: TrendingUp },
  { href: '/admin/analyse/wirkung', label: 'Wirkung', icon: Target },
  { href: '/admin/analyse/transparenz', label: 'Transparenz', icon: Eye },
]

/**
 * Navigation tabs for analyse section.
 */
export function AnalyseTabs() {
  const pathname = usePathname()

  return (
    <div className="border-b">
      <nav className="flex gap-1 overflow-x-auto" aria-label="Analyse Tabs">
        {TABS.map(tab => {
          const isActive = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={navLinkClass('tab', isActive, 'flex items-center gap-2')}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
