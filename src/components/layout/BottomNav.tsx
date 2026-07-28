'use client'

import type { LucideIcon } from 'lucide-react'
import { Menu } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { navLinkClass } from '@/lib/design/nav'

export interface BottomNavItem {
  key: string
  href: string
  label: string
  icon: LucideIcon
  active: boolean
}

interface BottomNavProps {
  items: BottomNavItem[]
  /** Accessible name for the <nav>. */
  ariaLabel: string
  /** Optional trailing "more" button (opens a sheet or the full sidebar). */
  more?: { label: string; ariaLabel: string; onClick: () => void; expanded?: boolean }
}

/**
 * BottomNav — the SSOT mobile bottom tab bar (`<lg` only).
 *
 * The admin shell and the user dashboard rendered this bar as two byte-identical
 * copies (differing only by an accidental `z-40` vs `z-50` and `border` vs
 * `border-subtle`). Both now feed items into this one component; item state
 * comes from the nav-state SSOT (`navLinkClass('bottomTab', …)`).
 *
 * Neutral location (`components/layout`) so the dashboard can use it without
 * importing from `app/admin/*` (forbidden by CLAUDE.md). Pair it with
 * `.has-bottom-nav` on the shell so `--bottom-nav-clearance` keeps content clear
 * of the bar (see globals.css).
 */
export function BottomNav({ items, ariaLabel, more }: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border bg-surface-base safe-area-inset-bottom lg:hidden"
    >
      {items.map(item => {
        const Icon = item.icon
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={navLinkClass('bottomTab', item.active)}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        )
      })}

      {more && (
        <Button
          variant="ghost"
          onClick={more.onClick}
          aria-label={more.ariaLabel}
          aria-expanded={more.expanded}
          className={navLinkClass('bottomTab', false, 'h-auto rounded-none')}
        >
          <Menu className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span>{more.label}</span>
        </Button>
      )}
    </nav>
  )
}
