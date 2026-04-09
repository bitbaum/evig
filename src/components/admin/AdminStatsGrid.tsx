import type { LucideIcon } from 'lucide-react'

export interface StatCardItem {
  icon: LucideIcon
  iconBgColor: string
  iconColor: string
  label: string
  value: number | string
  valueColor?: string
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

export function AdminStatsGrid({ items, columns = 4 }: AdminStatsGridProps) {
  return (
    <div className={`grid ${GRID_COLS[columns]} gap-4`}>
      {items.map((item, index) => {
        const Icon = item.icon
        const valueColor = item.valueColor ?? 'text-gray-900'
        return (
          <div key={index} className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${item.iconBgColor} rounded-lg flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${valueColor}`}>{item.value}</p>
                <p className="text-sm text-gray-600">{item.label}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
