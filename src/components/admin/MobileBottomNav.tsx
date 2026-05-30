'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { Menu } from 'lucide-react'
import { getMobileBottomNavSections } from '@/config/sections'

interface MobileBottomNavProps {
  onMenuClick: () => void
}

/**
 * Admin mobile bottom nav — three sections + Mehr (opens full sidebar).
 *
 * Items are derived from `sections.ts` via `mobileBottomNavOrder`. To
 * change what shows up here, flag the section with `mobileBottomNavOrder:
 * 1 | 2 | 3` and optionally `ui.mobileBottomNavLabel` for a shorter
 * label that fits the bar. The SSOT stays in one file; nothing about
 * this component knows which routes are "important enough."
 */
export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = getMobileBottomNavSections()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-neutral-200 bg-white dark:border-white/[0.06] dark:bg-neutral-950 lg:hidden"
      aria-label="Mobile Navigation"
    >
      {items.map(section => {
        // Dashboard ("/admin") needs exact-match so it isn't lit for
        // every /admin/* page; everything else uses prefix-match.
        const exact = section.path === '/admin'
        const active = exact ? pathname === section.path : pathname.startsWith(section.path)
        const Icon = section.ui.icon
        const label = section.ui.mobileBottomNavLabel ?? section.ui.label
        return (
          <Link
            key={section.id}
            href={section.path}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs transition-colors ${
              active
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Mehr — opens sidebar */}
      <button
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
        aria-label="Seitenleiste öffnen"
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
        <span>Mehr</span>
      </button>
    </nav>
  )
}
