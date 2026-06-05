'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogOut, Loader2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

const LOGOUT_CALLBACK = '/auth/login?logout=1'

async function forceServerSignOut(callbackUrl: string): Promise<void> {
  const csrfRes = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  if (!csrfRes.ok) {
    throw new Error('Failed to get CSRF token')
  }

  const csrfData = (await csrfRes.json()) as { csrfToken?: string }
  if (!csrfData.csrfToken) {
    throw new Error('Missing CSRF token')
  }

  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    callbackUrl,
    json: 'true',
  })

  const signOutRes = await fetch('/api/auth/signout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    credentials: 'same-origin',
    body,
  })

  if (!signOutRes.ok) {
    throw new Error('Signout request failed')
  }
}

export default function LogoutPage() {
  const t = useTranslations('auth.logout')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = t('pageTitle')

    const performSignOut = async () => {
      try {
        await forceServerSignOut(LOGOUT_CALLBACK)
        window.location.replace(LOGOUT_CALLBACK)
      } catch {
        setError(t('errorMessage'))
      }
    }

    performSignOut()
  }, [t])

  return (
    <main className="min-h-screen bg-surface-raised py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo showText={true} />
        </div>

        {/* Logout Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="card-shell rounded-2xl p-8 text-center">
            {!error ? (
              <div role="status" aria-live="polite">
                <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-action animate-spin" />
                </div>
                <Heading level={2} className="text-xl text-text-primary mb-2">
                  {t('heading')}
                </Heading>
                <p className="text-text-secondary dark:text-text-muted">{t('wait')}</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-error-100 dark:bg-error-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-error-600" />
                </div>
                <Heading level={2} className="text-xl text-text-primary mb-2">
                  {t('errorHeading')}
                </Heading>
                <p className="text-text-secondary dark:text-text-muted mb-6">{error}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setError(null)
                      void forceServerSignOut(LOGOUT_CALLBACK)
                        .then(() => {
                          window.location.replace(LOGOUT_CALLBACK)
                        })
                        .catch((retryError) => {
                          logger.error('Logout retry failed', { error: retryError })
                          setError(t('errorMessage'))
                        })
                    }}
                    variant="destructive"
                    className="w-full gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('retry')}
                  </Button>
                  <Button as={Link} href="/dashboard" variant="outline" className="w-full">
                    {t('backToDashboard')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
