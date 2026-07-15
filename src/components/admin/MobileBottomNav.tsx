'use client'

import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getMobileBottomNavSections } from '@/config/sections'

interface MobileBottomNavProps {
  accessibleSections: string[]
  onMenuClick: () => void
}

/**
 * Admin mobile bottom nav — three permission-filtered sections + Mehr.
 *
 * Items are derived from `sections.ts` via `mobileBottomNavOrder`. To
 * change what shows up here, flag the section with `mobileBottomNavOrder:
 * 1 | 2 | 3` and optionally `ui.mobileBottomNavLabel` for a shorter
 * label that fits the bar. The SSOT stays in one file; nothing about
 * this component knows which routes are "important enough."
 */
export function MobileBottomNav({ accessibleSections, onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const items = getMobileBottomNavSections(accessibleSections)
  const t = useTranslations('admin.sidebar')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border bg-surface-base safe-area-inset-bottom lg:hidden"
      aria-label={t('navAria')}
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
                ? 'text-action'
                : 'text-text-tertiary dark:text-text-tertiary hover:text-text-secondary'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}

      {/* Mehr — opens sidebar */}
      <Button
        variant="ghost"
        onClick={onMenuClick}
        className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] h-auto text-xs text-text-tertiary hover:text-text-secondary rounded-none"
        aria-label={t('openAria')}
      >
        <Menu className="w-5 h-5" aria-hidden="true" />
        <span>{t('mobileMore')}</span>
      </Button>
    </nav>
  )
}
