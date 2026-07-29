import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Eyebrow — the small mono, uppercase, wide-tracked kicker label that sits above
 * a section title. SSOT for the "eyebrow / kicker".
 *
 * This was hand-rolled 100+ times with a drifting letter-spacing (0.08 / 0.12 /
 * 0.14 / 0.16 / 0.18em) — the same element, five different tracks. Eyebrow renders
 * the `ui-public-eyebrow` utility (globals.css: mono · text-xs · uppercase ·
 * tracking-[0.18em] · text-tertiary), so there is one definition. Pass layout
 * extras (margins, a color override) via `className`; change the element with `as`.
 */
export function Eyebrow({
  children,
  className,
  as: Tag = 'p',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
}) {
  return <Tag className={cn('ui-public-eyebrow', className)}>{children}</Tag>
}
