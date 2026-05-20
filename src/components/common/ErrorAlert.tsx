'use client'

/**
 * ErrorAlert Component
 *
 * Reusable error alert component for consistent error handling.
 * Replaces inconsistent error patterns across pages.
 */

import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TYPOGRAPHY, SPACING } from '@/config/ui'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  variant?: 'inline' | 'card'
  className?: string
}

export function ErrorAlert({
  title,
  message,
  onRetry,
  retryLabel,
  variant = 'card',
  className = '',
}: ErrorAlertProps) {
  const t = useTranslations('errors')
  const effectiveTitle = title ?? t('genericTitle')
  const effectiveRetryLabel = retryLabel ?? t('retry')
  if (variant === 'inline') {
    return (
      <div className={`flex items-start gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg ${className}`}>
        <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className={`${TYPOGRAPHY.body} text-error-800 dark:text-error-200`}>{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={`${TYPOGRAPHY.buttonSmall} text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 underline`}
          >
            {effectiveRetryLabel}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`text-center ${SPACING.cardLarge} ${className}`}>
      <div className="mx-auto w-16 h-16 rounded-full bg-error-100 dark:bg-error-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-error-600 dark:text-error-400" />
      </div>
      <Heading level={3} className={`${TYPOGRAPHY.sectionTitleSmall} text-neutral-900 dark:text-neutral-100 mb-2`}>
        {effectiveTitle}
      </Heading>
      <p className={`${TYPOGRAPHY.body} text-neutral-600 dark:text-neutral-400 mb-6 max-w-md mx-auto`}>
        {message}
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="destructive"
        >
          <RefreshCw className="w-4 h-4" />
          {effectiveRetryLabel}
        </Button>
      )}
    </div>
  )
}
