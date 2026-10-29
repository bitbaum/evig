'use client';

/**
 * Chart barrel — recharts is heavy, so the one recharts chart (TrendBarChart)
 * is loaded lazily on the client (ssr: false) instead of shipping in the
 * initial bundle. RevenueByYearChart and RevenuePieChart are drawn by
 * @bitbaum/chartkit, which renders on the server with no client runtime, so
 * they are exported directly. ChartWrapper is internal to the charts and not
 * re-exported.
 */

import dynamic from 'next/dynamic';

function ChartLoading() {
  return (
    <div className="h-[380px] animate-pulse rounded-xl border bg-surface-base" aria-hidden="true" />
  );
}

export { RevenueByYearChart } from './RevenueByYearChart';
export { RevenuePieChart } from './RevenuePieChart';

export const TrendBarChart = dynamic(() => import('./TrendBarChart').then((m) => m.TrendBarChart), {
  ssr: false,
  loading: ChartLoading,
});
