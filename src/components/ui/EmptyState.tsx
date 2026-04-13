import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Heading from './Heading'

interface EmptyStateProps {
  icon: LucideIcon
  /** Tailwind bg classes for the icon circle, e.g. "bg-green-50 dark:bg-green-900/20" */
  iconBg?: string
  /** Tailwind text classes for the icon, e.g. "text-green-600 dark:text-green-400" */
  iconColor?: string
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon: Icon,
  iconBg = 'bg-gray-100 dark:bg-gray-700',
  iconColor = 'text-gray-500 dark:text-gray-400',
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center',
        className
      )}
    >
      <div
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4',
          iconBg
        )}
      >
        <Icon className={cn('w-7 h-7', iconColor)} aria-hidden="true" />
      </div>
      <Heading level={3} className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </Heading>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}
