/**
 * Skeleton shimmer components for dashboard Suspense fallbacks.
 * Kept intentionally minimal — they're transient (~100–200ms).
 */

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export function BannerSkeleton() {
  return <Shimmer className="h-16 rounded-xl" />
}

export function PersonalSectionSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-2">
      <Shimmer className="h-5 w-32 mb-3" />
      <Shimmer className="h-10" />
      <Shimmer className="h-10" />
    </div>
  )
}

export function UnifiedQueueSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 space-y-2">
      <Shimmer className="h-5 w-40 mb-3" />
      <Shimmer className="h-14" />
      <Shimmer className="h-14" />
      <Shimmer className="h-14" />
    </div>
  )
}
