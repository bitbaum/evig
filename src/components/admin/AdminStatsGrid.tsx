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
  green: 'text-primary-600 dark:text-primary-400',
  red:   'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
}

export function AdminStatsGrid({ items, columns = 4 }: AdminStatsGridProps) {
  return (
    <div className={`grid ${GRID_COLS[columns]} gap-4`}>
      {items.map((item, index) => {
        const Icon = item.icon
        const colorClasses = adminIconColor[item.color ?? 'gray']
        const valueColor = item.valueColor ?? ''

        return (
          <div
            key={index}
            className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4"
          >
            <div className="flex items-start gap-3">
              {/* Icon box */}
              <div className={cn(adminIconBox.sm, colorClasses)}>
                <Icon className={adminIconBox.icon} />
              </div>

              {/* Value + label */}
              <div className="min-w-0">
                <p className={cn(adminType.stat, valueColor)}>{item.value}</p>
                <p className={adminType.statLabel}>{item.label}</p>
                {item.trend && (
                  <p className={cn('text-xs mt-0.5', item.trendColor ? TREND_COLOR[item.trendColor] : 'text-neutral-400')}>
                    {item.trend}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
