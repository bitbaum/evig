import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { adminIconBox, adminIconColor, adminType, type AdminIconColorKey } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'

export interface StatCardItem {
  icon: LucideIcon
  /** Semantic color key from adminIconColor */
  color?: AdminIconColorKey
  label: string
  value: number | string
  /** Optional override for the value text color */
  valueColor?: string
  /** Optional trend or secondary text below label */
  trend?: string
  trendColor?: 'green' | 'red' | 'amber'
  /** When set, the entire card becomes a Link to this href (quick-filter UX) */
  href?: string
}

interface AdminStatsGridProps {
  items: StatCardItem[]
  columns?: 2 | 3 | 4 | 5
}

const GRID_COLS: Record<2 | 3 | 4 | 5, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
  4: 'grid-cols-2 md:grid-cols-4',
  5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
}

const TREND_COLOR = {
  green: 'text-action',
  red:   'text-error-600 dark:text-error-400',
  amber: 'text-warning-600 dark:text-warning-400',
}

export function AdminStatsGrid({ items, columns = 4 }: AdminStatsGridProps) {
  return (
    <div className={`grid ${GRID_COLS[columns]} gap-4`}>
      {items.map((item, index) => {
        const Icon = item.icon
        const colorClasses = adminIconColor[item.color ?? 'gray']
        const valueColor = item.valueColor ?? ''

        const cardClass = cn(
          'rounded-lg border border bg-surface-base p-4',
          item.href && 'transition-colors hover:border-strong hover:bg-surface-raised'
        )

        const body = (
          <div className="flex items-start gap-3">
            <div className={cn(adminIconBox.sm, colorClasses)}>
              <Icon className={adminIconBox.icon} />
            </div>
            <div className="min-w-0">
              <p className={cn(adminType.stat, valueColor)}>{item.value}</p>
              <p className={adminType.statLabel}>{item.label}</p>
              {item.trend && (
                <p className={cn('text-xs mt-0.5', item.trendColor ? TREND_COLOR[item.trendColor] : 'text-text-muted')}>
                  {item.trend}
                </p>
              )}
            </div>
          </div>
        )

        return item.href ? (
          <Link key={index} href={item.href} className={cardClass}>{body}</Link>
        ) : (
          <div key={index} className={cardClass}>{body}</div>
        )
      })}
    </div>
  )
}
