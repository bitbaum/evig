'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartWrapper } from './ChartWrapper'
import { formatCHF } from '@/lib/hirn/format'
import { REVENUE_CATEGORY_COLORS, REVENUE_CATEGORY_LABELS } from '@/config/ui-colors'

interface RevenueDataPoint {
  year: number
  warenverkauf: number
  dienstleistungen: number
  integration: number
  spenden: number
  aufstockung: number
  total: number
}

interface RevenueAreaChartProps {
  data: RevenueDataPoint[]
  source?: string
  sourceDate?: string
}

const CHART_COLORS = REVENUE_CATEGORY_COLORS

const CATEGORY_LABELS = REVENUE_CATEGORY_LABELS

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload) return null

  const total = payload.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4 text-sm">
          <span style={{ color: entry.color }}>
            {CATEGORY_LABELS[entry.name as keyof typeof CATEGORY_LABELS] || entry.name}
          </span>
          <span className="font-medium">{formatCHF(entry.value)}</span>
        </div>
      ))}
      <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
        <span>Total</span>
        <span>{formatCHF(total)}</span>
      </div>
    </div>
  )
}

/**
 * Stacked area chart showing revenue breakdown over time.
 * Displays all revenue categories (Warenverkauf, Dienstleistungen, etc.)
 */
export function RevenueAreaChart({ data, source, sourceDate }: RevenueAreaChartProps) {
  // Sort data by year ascending for proper time series display
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  return (
    <ChartWrapper
      title="Einnahmen im Zeitverlauf"
      description="Entwicklung der Einnahmequellen über die Jahre"
      source={source}
      sourceDate={sourceDate}
      height={350}
    >
      <AreaChart
        data={sortedData}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
        <XAxis
          dataKey="year"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tickFormatter={(value) => `${Math.round(value / 1000)}k`}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => CATEGORY_LABELS[value as keyof typeof CATEGORY_LABELS] || value}
        />
        <Area
          type="monotone"
          dataKey="warenverkauf"
          stackId="1"
          stroke={CHART_COLORS.warenverkauf}
          fill={CHART_COLORS.warenverkauf}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="dienstleistungen"
          stackId="1"
          stroke={CHART_COLORS.dienstleistungen}
          fill={CHART_COLORS.dienstleistungen}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="integration"
          stackId="1"
          stroke={CHART_COLORS.integration}
          fill={CHART_COLORS.integration}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="spenden"
          stackId="1"
          stroke={CHART_COLORS.spenden}
          fill={CHART_COLORS.spenden}
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="aufstockung"
          stackId="1"
          stroke={CHART_COLORS.aufstockung}
          fill={CHART_COLORS.aufstockung}
          fillOpacity={0.6}
        />
      </AreaChart>
    </ChartWrapper>
  )
}
