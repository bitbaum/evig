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

const CATEGORY_CONFIG = {
  warenverkauf: { label: 'Warenverkauf', color: '#22c55e' },
  dienstleistungen: { label: 'Dienstleistungen', color: '#3b82f6' },
  integration: { label: 'Integration', color: '#8b5cf6' },
  spenden: { label: 'Spenden', color: '#f59e0b' },
  aufstockung: { label: 'Aufstockung', color: '#ec4899' },
}

function formatCHF(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: PieDataPoint }>
}) {
  if (!active || !payload || !payload[0]) return null

  const data = payload[0].payload
  return (
    <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow-lg">
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
