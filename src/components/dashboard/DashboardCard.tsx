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

import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'
import type { DashboardCard as DashboardCardType } from '@/config/dashboard'

interface DashboardCardProps {
  card: DashboardCardType
  className?: string
}

const colorClasses = {
  info: {
    bg: 'bg-action-muted',
    text: 'text-action',
  },
  success: {
    bg: 'bg-action-muted',
    text: 'text-action',
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
    bg: 'bg-surface-raised',
    text: 'text-text-secondary',
  },
}

export function DashboardCard({ card, className }: DashboardCardProps) {
  const colorClass = colorClasses[card.color]

  return (
    <Link
      href={card.href}
      className={cn(
        'card-shell rounded-lg border-2',
        'p-4 sm:p-6 hover:border-strong transition-colors',
        className
      )}
    >
      <div className="flex items-center">
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center shrink-0',
          colorClass.bg
        )}>
          <span className={cn('text-xl', colorClass.text)}>
            {card.icon}
          </span>
        </div>
        <div className="ml-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Heading level={3} className={cn(
              'text-lg font-semibold',
              getTextColor('white', 'primary'),
              'dark:text-white truncate'
            )}>
              {card.title}
            </Heading>
            {card.badge && (
              <span className="px-2 py-0.5 text-xs font-medium bg-action-muted text-action rounded-sm">
                {card.badge}
              </span>
            )}
          </div>
          <p className={cn(
            'text-sm mt-1',
            getTextColor('white', 'muted'),
            'dark:text-text-muted line-clamp-2'
          )}>
            {card.description}
          </p>
        </div>
      </div>
    </Link>
  )
}
