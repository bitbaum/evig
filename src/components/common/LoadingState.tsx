/**
 * LoadingState Component
 *
 * Reusable loading state components for consistent UX.
 * Replaces inconsistent loading patterns across pages.
 */

import { Loader2 } from 'lucide-react'
import { TYPOGRAPHY, SPACING } from '@/config/ui'

interface LoadingSpinnerProps {
  message?: string
  className?: string
}

export function LoadingSpinner({ message = 'Wird geladen...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${SPACING.cardLarge} ${className}`}>
      <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
      <p className={`${TYPOGRAPHY.body} text-neutral-600`}>{message}</p>
    </div>
  )
}

interface LoadingSkeletonProps {
  count?: number
  className?: string
}

export function LoadingSkeleton({ count = 6, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card-shell p-4 animate-pulse">
          <div className="w-full h-48 bg-neutral-200 dark:bg-neutral-700 rounded-lg mb-4" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm mb-2" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-2/3 mb-4" />
          <div className="flex justify-between">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/4" />
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-sm w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
