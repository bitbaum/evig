'use client'

/**
 * Chart barrel — recharts is heavy, so the chart components are loaded
 * lazily on the client (ssr: false) instead of shipping in the initial
 * bundle. ChartWrapper is internal to the charts and not re-exported.
 */

import dynamic from 'next/dynamic'

function ChartLoading() {
  return <div className="h-[380px] animate-pulse rounded-xl border bg-surface-base" aria-hidden="true" />
}

export const RevenueAreaChart = dynamic(
  () => import('./RevenueAreaChart').then(m => m.RevenueAreaChart),
  { ssr: false, loading: ChartLoading }
)

export const RevenuePieChart = dynamic(
  () => import('./RevenuePieChart').then(m => m.RevenuePieChart),
  { ssr: false, loading: ChartLoading }
)

export const TrendBarChart = dynamic(
  () => import('./TrendBarChart').then(m => m.TrendBarChart),
  { ssr: false, loading: ChartLoading }
)
