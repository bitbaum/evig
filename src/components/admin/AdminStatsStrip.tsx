import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { adminIconBox, adminIconColor, adminInteractive, adminType, type AdminIconColorKey } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

export interface StatItem {
  icon: LucideIcon
  /** Semantic color key from adminIconColor */
  color?: AdminIconColorKey
  label: string
  value: number | string
  /** Optional override for the value text color */
  valueColor?: string
  /** Optional trend or secondary text after the label */
  trend?: string
  trendColor?: 'green' | 'red' | 'amber'
  /** When set, the entire pill becomes a Link to this href (quick-filter UX) */
  href?: string
}

interface AdminStatsStripProps {
  items: StatItem[]
}

const TREND_COLOR = {
  green: 'text-action',
  red:   'text-error-600 dark:text-error-400',
  amber: 'text-warning-600 dark:text-warning-400',
}

/**
 * AdminStatsStrip — compact one-line stat summary for admin list pages.
 *
 * Replaces the former AdminStatsGrid card wall: counts are orientation, not
 * the page's content, so they render as a wrapping row of small pills
 * (icon chip + value + label) instead of full-width cards that pushed the
 * actual work below the fold — one screen of scrolling saved on mobile.
 * Items with `href` stay clickable as quick filters.
 */
export function AdminStatsStrip({ items }: AdminStatsStripProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => {
        const Icon = item.icon
        const colorClasses = adminIconColor[item.color ?? 'gray']

        const pillClass = cn(
          'inline-flex items-center gap-2 rounded-lg border border bg-surface-base py-1.5 pl-1.5 pr-3',
          item.href && `transition-colors hover:border-strong ${adminInteractive.rowHover}`
        )

        const body = (
          <>
            <span className={cn(adminIconBox.xs, colorClasses)}>
              <Icon className={adminIconBox.iconXs} />
            </span>
            <span className={cn(adminType.stat, item.valueColor)}>{item.value}</span>
            <span className={adminType.statLabel}>{item.label}</span>
            {item.trend && (
              <span className={cn('text-xs', item.trendColor ? TREND_COLOR[item.trendColor] : 'text-text-muted')}>
                {item.trend}
              </span>
            )}
          </>
        )

        return item.href ? (
          <Link key={index} href={item.href} className={pillClass}>{body}</Link>
        ) : (
          <div key={index} className={pillClass}>{body}</div>
        )
      })}
    </div>
  )
}
