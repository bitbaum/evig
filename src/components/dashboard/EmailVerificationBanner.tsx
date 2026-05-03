'use client'

import React, { useState } from 'react'
import { AlertTriangle, Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api/client'

interface EmailVerificationBannerProps {
  email: string
  className?: string
}

export function EmailVerificationBanner({ email, className }: EmailVerificationBannerProps) {
  const t = useTranslations('dashboard.emailVerification')
  const [isVisible, setIsVisible] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState<string>()

  const handleResend = async () => {
    setIsLoading(true)
    setError(undefined)

    try {
      const { error: apiError } = await apiFetch('/api/auth/resend-code', {
        method: 'POST',
        body: { email },
      })

      if (apiError) {
        setError(apiError)
        return
      }

      setIsSent(true)
    } catch {
      setError(t('networkError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'bg-warning-50 dark:bg-warning-900/30 border-l-4 border-warning-400 dark:border-warning-500 p-4 rounded-r-lg',
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-warning-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <Heading level={3} className="text-sm font-medium text-warning-800 dark:text-warning-200">
            {t('heading')}
          </Heading>
          <div className="mt-2 text-sm text-warning-700 dark:text-warning-300">
            <p>
              {t('description', { email })}
            </p>
          </div>
          <div className="mt-4">
            {isSent ? (
              <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('sent')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md',
                    'bg-warning-100 dark:bg-warning-800 text-warning-800 dark:text-warning-100',
                    'hover:bg-warning-200 dark:hover:bg-warning-700',
                    'focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {t('resend')}
                </button>
                {error && (
                  <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="inline-flex rounded-md text-warning-500 hover:text-warning-600 focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
          >
            <span className="sr-only">{t('close')}</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
