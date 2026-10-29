'use client';

/**
 * Chart barrel — recharts is heavy, so the recharts charts are loaded
 * lazily on the client (ssr: false) instead of shipping in the initial
 * bundle. RevenuePieChart is drawn by @bitbaum/chartkit, which renders on the
 * server with no client runtime, so it is exported directly. ChartWrapper is
 * internal to the charts and not re-exported.
 */

import dynamic from 'next/dynamic';

function ChartLoading() {
  return (
    <div className="h-[380px] animate-pulse rounded-xl border bg-surface-base" aria-hidden="true" />
  );
}

export const RevenueAreaChart = dynamic(
  () => import('./RevenueAreaChart').then((m) => m.RevenueAreaChart),
  { ssr: false, loading: ChartLoading },
);

export { RevenuePieChart } from './RevenuePieChart';

export const TrendBarChart = dynamic(() => import('./TrendBarChart').then((m) => m.TrendBarChart), {
  ssr: false,
  loading: ChartLoading,
});
