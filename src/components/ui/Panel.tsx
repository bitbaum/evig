import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'

/**
 * Panel — a titled content surface. The SSOT for "a bordered card with a
 * header row (title + optional subtitle + optional right-aligned action) and a
 * body".
 *
 * Before this primitive, ~7 components hand-rolled the same shape:
 * `<section className="bg-surface-base rounded-lg border p-5">` plus a
 * `<h2 …>` / `<p text-xs text-text-tertiary>` / right-action header block —
 * each drifting on radius (`rounded-lg` vs `rounded-xl`), border presence, and
 * stray `shadow-xs`. Panel resolves the surface from `card-shell` (the same
 * class `<Card>` uses) and the title from `designPrimitive.type.panelTitle`, so
 * every titled panel is identical and retheming happens in one place.
 *
 * For an untitled surface use `<Card>`. For a header row *inside* an existing
 * card use `<AdminSectionHeader>`. For a full-bleed page hero use `<PageHero>`.
 */
interface PanelProps {
  /** Panel heading. Omit for a body-only surface (prefer <Card> then). */
  title?: ReactNode
  /** Secondary line under the title. */
  subtitle?: ReactNode
  /** Small icon rendered inline before the title. */
  icon?: LucideIcon
  /** Right-aligned header slot — buttons, selects, badges. */
  action?: ReactNode
  /** Extra classes on the panel surface (padding override, margins, etc.). */
  className?: string
  /** Extra classes on the header row. */
  headerClassName?: string
  /** Semantic element. Defaults to <section>. */
  as?: 'section' | 'div'
  id?: string
  children?: ReactNode
}

export function Panel({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
  headerClassName,
  as: Tag = 'section',
  id,
  children,
}: PanelProps) {
  const hasHeader = title != null || action != null
  return (
    <Tag id={id} className={cn('card-shell p-4 sm:p-5', className)}>
      {hasHeader && (
        <div className={cn('flex items-start justify-between gap-3', children != null && 'mb-4', headerClassName)}>
          <div className="flex items-start gap-2 min-w-0">
            {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden="true" />}
            {title != null && (
              <div className="min-w-0">
                <h2 className={designPrimitive.type.panelTitle}>{title}</h2>
                {subtitle != null && <p className="mt-0.5 text-xs text-text-tertiary">{subtitle}</p>}
              </div>
            )}
          </div>
          {action != null && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </Tag>
  )
}
