'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts'
import { ChartWrapper } from './ChartWrapper'
import { formatCHF } from '@/lib/hirn/format'
import { TREND_CHART_COLORS } from '@/config/ui-colors'

interface TrendDataPoint {
  category: string
  currentValue: number
  previousValue: number
  percentChange: number
}

interface TrendBarChartProps {
  data: TrendDataPoint[]
  currentYear: number
  previousYear: number
  source?: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload || !payload[0]) return null

  const current = payload.find(p => p.dataKey === 'currentValue')?.value || 0
  const previous = payload.find(p => p.dataKey === 'previousValue')?.value || 0
  const percentChange = previous > 0
    ? ((current - previous) / previous * 100).toFixed(1)
    : 'N/A'

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-blue-500">Aktuell</span>
          <span className="font-medium">{formatCHF(current)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-gray-400">Vorjahr</span>
          <span className="font-medium">{formatCHF(previous)}</span>
        </div>
        <div className="border-t pt-1 flex justify-between gap-4">
          <span>Veränderung</span>
          <span className={`font-semibold ${
            Number(percentChange) > 0 ? 'text-green-500' :
            Number(percentChange) < 0 ? 'text-red-500' : ''
          }`}>
            {percentChange !== 'N/A' ? `${percentChange}%` : percentChange}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Grouped bar chart showing year-over-year comparison by category.
 */
export function TrendBarChart({ data, currentYear, previousYear, source }: TrendBarChartProps) {
  return (
    <ChartWrapper
      title={`Vergleich ${previousYear} vs ${currentYear}`}
      description="Jahresvergleich nach Einnahmekategorie"
      source={source}
      height={300}
    >
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="category"
          tick={{ fontSize: 11 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar
          dataKey="previousValue"
          name={`${previousYear}`}
          fill={TREND_CHART_COLORS.previousYear}
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="currentValue"
          name={`${currentYear}`}
          fill={TREND_CHART_COLORS.currentYear}
          radius={[4, 4, 0, 0]}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.percentChange > 0 ? TREND_CHART_COLORS.positive : entry.percentChange < 0 ? TREND_CHART_COLORS.negative : TREND_CHART_COLORS.neutral}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartWrapper>
  )
}
