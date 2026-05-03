/**
 * EmptyState Component
 *
 * Reusable empty state component used across marketplace and IT-Hilfe pages.
 * Replaces duplicated empty state markup in 5+ locations.
 */

import { LucideIcon, Package } from 'lucide-react'
import { TYPOGRAPHY, SPACING } from '@/config/ui'
import Heading from '@/components/ui/Heading'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({
  icon: Icon = Package,
  title,
  message,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center ${SPACING.cardLarge} ${className}`}>
      <div className="mx-auto w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-neutral-500" />
      </div>
      <Heading level={3} className={`${TYPOGRAPHY.sectionTitleSmall} text-neutral-900 dark:text-neutral-100 mb-2`}>
        {title}
      </Heading>
      <p className={`${TYPOGRAPHY.body} text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto`}>
        {message}
      </p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${TYPOGRAPHY.button} bg-primary-600 text-white hover:bg-primary-700 transition-colors`}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${TYPOGRAPHY.button} bg-primary-600 text-white hover:bg-primary-700 transition-colors`}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
