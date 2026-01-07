/**
 * Dashboard Card Component
 * 
 * Reusable card component for dashboard navigation items.
 * Following dev guide: docs/development/DEV_GUIDE.md - DRY principle
 * 
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 * Last Modified Summary: Initial dashboard card component
 */

'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import type { DashboardCard as DashboardCardType } from '@/config/dashboard'

interface DashboardCardProps {
  card: DashboardCardType
  className?: string
}

const colorClasses = {
  info: {
    bg: 'bg-info-100 dark:bg-info-900',
    text: 'text-info-600 dark:text-info-400',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-600 dark:text-green-400',
  },
  warning: {
    bg: 'bg-warning-100 dark:bg-warning-900',
    text: 'text-warning-600 dark:text-warning-400',
  },
  error: {
    bg: 'bg-error-100 dark:bg-error-900',
    text: 'text-error-600 dark:text-error-400',
  },
  secondary: {
    bg: 'bg-secondary-100 dark:bg-secondary-900',
    text: 'text-secondary-600 dark:text-secondary-400',
  },
  neutral: {
    bg: 'bg-neutral-100 dark:bg-neutral-800',
    text: 'text-neutral-600 dark:text-neutral-400',
  },
}

export function DashboardCard({ card, className }: DashboardCardProps) {
  const colorClass = colorClasses[card.color]

  return (
    <Link
      href={card.href}
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-lg shadow-sm',
        'border-2 border-neutral-200 dark:border-neutral-700',
        'p-4 sm:p-6 hover:shadow-md transition-all duration-200',
        'hover:border-neutral-300 dark:hover:border-neutral-600',
        className
      )}
    >
      <div className="flex items-center">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
          colorClass.bg
        )}>
          <span className={cn('text-xl', colorClass.text)}>
            {card.icon}
          </span>
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              'text-lg font-semibold',
              getTextColor('white', 'primary'),
              'dark:text-white truncate'
            )}>
              {card.title}
            </h3>
            {card.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                {card.badge}
              </span>
            )}
          </div>
          <p className={cn(
            'text-sm mt-1',
            getTextColor('white', 'muted'),
            'dark:text-neutral-400 line-clamp-2'
          )}>
            {card.description}
          </p>
        </div>
      </div>
    </Link>
  )
}
