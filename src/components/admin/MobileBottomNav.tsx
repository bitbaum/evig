'use client'

import { Link } from '@/i18n/navigation'
import { usePathname } from 'next/navigation'
import { Home, CheckSquare, Vote, Menu } from 'lucide-react'

interface MobileBottomNavProps {
  onMenuClick: () => void
}

const NAV_ITEMS = [
  { href: '/admin', icon: Home, label: 'Heute', exact: true },
  { href: '/admin/tasks', icon: CheckSquare, label: 'Aufgaben', exact: false },
  { href: '/admin/decisions', icon: Vote, label: 'Entscheide', exact: false },
] as const

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-neutral-200 bg-white dark:border-white/[0.06] dark:bg-neutral-950 lg:hidden"
      aria-label="Mobile Navigation"
    >
      {NAV_ITEMS.map(({ href, icon: Icon, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
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
