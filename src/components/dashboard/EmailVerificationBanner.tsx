'use client'

import React, { useState } from 'react'
import { AlertTriangle, Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api/client'

interface EmailVerificationBannerProps {
  email: string
  className?: string
}

export function EmailVerificationBanner({ email, className }: EmailVerificationBannerProps) {
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
      setError('Netzwerkfehler')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'bg-amber-50 dark:bg-amber-900/30 border-l-4 border-amber-400 dark:border-amber-500 p-4 rounded-r-lg',
      className
    )}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-amber-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1">
          <Heading level={3} className="text-sm font-medium text-amber-800 dark:text-amber-200">
            E-Mail-Adresse nicht bestätigt
          </Heading>
          <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            <p>
              Bitte bestätige deine E-Mail-Adresse <strong>{email}</strong>, um alle Funktionen nutzen zu können.
            </p>
          </div>
          <div className="mt-4">
            {isSent ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Ein neuer Bestätigungscode wurde gesendet!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isLoading}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md',
                    'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-100',
                    'hover:bg-amber-200 dark:hover:bg-amber-700',
                    'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Code erneut senden
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
            className="inline-flex rounded-md text-amber-500 hover:text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            <span className="sr-only">Schliessen</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
