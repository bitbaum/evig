'use client'

import React, { useState } from 'react'
import { AlertTriangle, Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <div className="shrink-0">
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
              <div className="flex items-center gap-2 text-sm text-action">
                <CheckCircle2 className="h-4 w-4" />
                <span>{t('sent')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="warning"
                  size="sm"
                  onClick={handleResend}
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md h-auto',
                    'bg-warning-100 dark:bg-warning-800 text-warning-800 dark:text-warning-100',
                    'hover:bg-warning-200 dark:hover:bg-warning-700'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {t('resend')}
                </Button>
                {error && (
                  <span className="text-sm text-error-600 dark:text-error-400">{error}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="ml-4 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            className="inline-flex rounded-md text-warning-500 hover:text-warning-600 h-auto w-auto p-0 bg-transparent hover:bg-transparent"
          >
            <span className="sr-only">{t('close')}</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
