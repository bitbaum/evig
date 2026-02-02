'use client'

import { KPICard } from './KPICard'
import type { MetricDefinition } from '@/config/analyse/metrics'

interface KPIValue {
  metricId: string
  value?: number | string
  previousValue?: number
}

interface KPIGridProps {
  metrics: MetricDefinition[]
  values?: KPIValue[]
  columns?: 2 | 3 | 4
}

/**
 * Grid layout for KPI cards.
 */
export function KPIGrid({ metrics, values = [], columns = 3 }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {metrics.map(metric => {
        const kpiValue = values.find(v => v.metricId === metric.id)
        return (
          <KPICard
            key={metric.id}
            metric={metric}
            value={kpiValue?.value}
            previousValue={kpiValue?.previousValue}
          />
        )
      })}
    </div>
  )
}
