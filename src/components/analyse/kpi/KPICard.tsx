'use client'

import { TrendingUp, TrendingDown, Minus, AlertCircle, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { MetricDefinition } from '@/config/analyse/metrics'

interface KPICardProps {
  metric: MetricDefinition
  value?: number | string
  previousValue?: number
  showTrend?: boolean
  formatValue?: (value: number) => string
}

function formatDefaultValue(value: number, unit: string): string {
  if (unit === 'CHF') {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }
  if (unit === '%') {
    return `${value.toFixed(1)}%`
  }
  if (value >= 1000) {
    return new Intl.NumberFormat('de-CH').format(value)
  }
  return String(value)
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const percentChange = previous !== 0
    ? ((current - previous) / previous) * 100
    : current > 0 ? 100 : 0

  const isUp = percentChange > 5
  const isDown = percentChange < -5

  if (isUp) {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <TrendingUp className="w-4 h-4" />
        <span className="text-sm font-medium">+{percentChange.toFixed(1)}%</span>
      </div>
    )
  }

  if (isDown) {
    return (
      <div className="flex items-center gap-1 text-red-600">
        <TrendingDown className="w-4 h-4" />
        <span className="text-sm font-medium">{percentChange.toFixed(1)}%</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 text-gray-500">
      <Minus className="w-4 h-4" />
      <span className="text-sm">stabil</span>
    </div>
  )
}

/**
 * Single KPI card with value, trend indicator, and source hover.
 */
export function KPICard({
  metric,
  value,
  previousValue,
  showTrend = true,
  formatValue,
}: KPICardProps) {
  const needsData = metric.status === 'needs_data' && value === undefined
  const numericValue = typeof value === 'number' ? value : undefined

  const displayValue = needsData
    ? '[TBD]'
    : numericValue !== undefined
      ? (formatValue ? formatValue(numericValue) : formatDefaultValue(numericValue, metric.unit))
      : String(value ?? '—')

  return (
    <Card className="relative group">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm text-muted-foreground">{metric.name}</span>
          {metric.formula && (
            <div className="relative">
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <strong>Formel:</strong> {metric.formula}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${needsData ? 'text-amber-500' : ''}`}>
            {displayValue}
          </span>
          {!needsData && metric.unit && metric.unit !== 'CHF' && metric.unit !== '%' && (
            <span className="text-sm text-muted-foreground">{metric.unit}</span>
          )}
        </div>

        {needsData && (
          <div className="mt-2 flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">Daten benötigt</span>
          </div>
        )}

        {!needsData && showTrend && numericValue !== undefined && previousValue !== undefined && (
          <div className="mt-2">
            <TrendIndicator current={numericValue} previous={previousValue} />
          </div>
        )}

        {metric.target && (
          <div className="mt-2 text-xs text-muted-foreground">
            Ziel: {metric.target}
          </div>
        )}

        <div className="mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Quelle: {metric.source === 'kivitendo' ? 'Kivitendo' : metric.source === 'calculated' ? 'Berechnet' : 'Manuell'}
        </div>
      </CardContent>
    </Card>
  )
}
