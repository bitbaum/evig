/**
 * EmptyState Component
 *
 * Reusable empty state component used across marketplace and IT-Hilfe pages.
 * Replaces duplicated empty state markup in 5+ locations.
 */

import { LucideIcon, Package } from 'lucide-react'
import { TYPOGRAPHY, SPACING } from '@/config/ui'

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
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className={`${TYPOGRAPHY.sectionTitleSmall} text-gray-900 dark:text-gray-100 mb-2`}>
        {title}
      </h3>
      <p className={`${TYPOGRAPHY.body} text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto`}>
        {message}
      </p>
      {action && (
        action.href ? (
          <a
            href={action.href}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${TYPOGRAPHY.button} bg-green-600 text-white hover:bg-green-700 transition-colors`}
          >
            {action.label}
          </a>
        ) : (
          <button
            onClick={action.onClick}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-lg ${TYPOGRAPHY.button} bg-green-600 text-white hover:bg-green-700 transition-colors`}
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
