/**
 * ErrorAlert Component
 *
 * Reusable error alert component for consistent error handling.
 * Replaces inconsistent error patterns across pages.
 */

import { AlertCircle, RefreshCw } from 'lucide-react'
import { TYPOGRAPHY, SPACING } from '@/config/ui'
import Heading from '@/components/ui/Heading'

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  variant?: 'inline' | 'card'
  className?: string
}

export function ErrorAlert({
  title = 'Ein Fehler ist aufgetreten',
  message,
  onRetry,
  retryLabel = 'Erneut versuchen',
  variant = 'card',
  className = '',
}: ErrorAlertProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className={`${TYPOGRAPHY.body} text-red-800 dark:text-red-200`}>{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${TYPOGRAPHY.buttonSmall} text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline`}
          >
            {retryLabel}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`text-center ${SPACING.cardLarge} ${className}`}>
      <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <Heading level={3} className={`${TYPOGRAPHY.sectionTitleSmall} text-gray-900 dark:text-gray-100 mb-2`}>
        {title}
      </Heading>
      <p className={`${TYPOGRAPHY.body} text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto`}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${TYPOGRAPHY.button} bg-red-600 text-white hover:bg-red-700 transition-colors`}
        >
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </button>
      )}
    </div>
  )
}
