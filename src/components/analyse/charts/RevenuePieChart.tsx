'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCHF } from '@/lib/hirn/format'
import { REVENUE_CATEGORY_COLORS, REVENUE_CATEGORY_LABELS } from '@/config/ui-colors'

interface PieDataPoint {
  name: string
  value: number
  color: string
}

interface RevenuePieChartProps {
  data: {
    warenverkauf: number
    dienstleistungen: number
    integration: number
    spenden: number
    aufstockung: number
  }
  year: number
  source?: string
}

const CATEGORY_CONFIG = Object.fromEntries(
  Object.entries(REVENUE_CATEGORY_COLORS).map(([key, color]) => [
    key,
    { label: REVENUE_CATEGORY_LABELS[key as keyof typeof REVENUE_CATEGORY_LABELS], color },
  ])
) as Record<keyof typeof REVENUE_CATEGORY_COLORS, { label: string; color: string }>

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: PieDataPoint }>
}) {
  if (!active || !payload || !payload[0]) return null

  const data = payload[0].payload
  return (
    <div className="card-shell p-3">
      <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
      <p className="text-lg font-bold">{formatCHF(data.value)}</p>
    </div>
  )
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) {
  if (!cx || !cy || !midAngle || !innerRadius || !outerRadius || !percent || percent < 0.05) return null

  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

/**
 * Pie chart showing revenue breakdown by category for a single year.
 */
export function RevenuePieChart({ data, year, source }: RevenuePieChartProps) {
  // Transform data for pie chart, filtering out zero values
  const pieData: PieDataPoint[] = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([key, value]) => ({
      name: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG].label,
      value,
      color: CATEGORY_CONFIG[key as keyof typeof CATEGORY_CONFIG].color,
    }))

  const total = pieData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Einnahmenverteilung {year}</CardTitle>
        <CardDescription>
          Total: {formatCHF(total)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {source && (
          <div className="mt-2 text-xs text-muted-foreground">
            Quelle: {source}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
