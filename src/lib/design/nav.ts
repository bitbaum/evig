/**
 * Navigation-state SSOT.
 *
 * The ONE definition of how a navigation item looks in each of its shapes and
 * states. Every nav surface — top header, vertical sidebar, mobile bottom tab
 * bar, bottom-sheet grid — resolves its active/inactive classes from here, so
 * "the current page" has exactly one visual meaning across the whole product.
 *
 * Neutral module (NOT admin-scoped): dashboard, public, and admin chrome all
 * consume it. `src/lib/admin-ui.ts` re-exports `NAV_STATE.sidebar.active` as
 * `adminInteractive.navActive` so the value is defined once, here.
 *
 * Before this file, the "active nav item" was encoded five different ways
 * (`ring-action/20` vs `ring-action/30` vs inline `bg-action-muted text-action`
 * vs `border-action …` vs bare `text-action`). Add a shape here rather than
 * hand-rolling a sixth.
 */
import { cn } from '@/lib/utils'

export type NavShape = 'sidebar' | 'bottomTab' | 'pill'

/**
 * base     — layout/shape classes shared by both states
 * active   — current route
 * inactive — resting + hover
 */
export const NAV_STATE: Record<NavShape, { base: string; active: string; inactive: string }> = {
  /** Vertical sidebar link (admin shell, detail sidebars). */
  sidebar: {
    base: 'flex items-center gap-2.5 rounded-lg px-2 py-3 lg:py-1.5 transition-colors',
    active: 'bg-action/10 text-action ring-1 ring-action/20',
    inactive:
      'text-text-tertiary hover:bg-surface-raised hover:text-text-primary dark:hover:bg-surface-base/4',
  },
  /** Mobile bottom-tab item (icon stacked over label). 56px thumb target. */
  bottomTab: {
    base: 'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors',
    active: 'text-action',
    inactive: 'text-text-tertiary hover:text-text-secondary',
  },
  /** Bordered chip/pill (bottom-sheet grid, secondary nav clusters). */
  pill: {
    base: 'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors',
    active: 'border-action bg-action-muted text-action',
    inactive:
      'border-subtle text-text-secondary hover:border-strong hover:text-text-primary',
  },
}

/** Resolve the full class string for a nav item of the given shape + state. */
export function navLinkClass(shape: NavShape, active: boolean, className?: string): string {
  const s = NAV_STATE[shape]
  return cn(s.base, active ? s.active : s.inactive, className)
}
