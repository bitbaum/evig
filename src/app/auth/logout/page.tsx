'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LogOut, Loader2, AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Abmelden | RevampIT'

    const performSignOut = async () => {
      try {
        await forceServerSignOut(LOGOUT_CALLBACK)
        window.location.replace(LOGOUT_CALLBACK)
      } catch {
        setError('Abmeldung fehlgeschlagen. Bitte versuche es erneut.')
      }
    }

    performSignOut()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Revamp<span className="text-green-600">IT</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Logout Card */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            {!error ? (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Abmeldung läuft...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Bitte warte einen Moment.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Abmeldung fehlgeschlagen
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      setError(null)
                      void forceServerSignOut(LOGOUT_CALLBACK)
                        .then(() => {
                          window.location.replace(LOGOUT_CALLBACK)
                        })
                        .catch((error) => {
                          logger.error('Logout failed', { error })
                          setError('Abmeldung fehlgeschlagen. Bitte versuche es erneut.')
                        })
                    }}
                    variant="destructive"
                    className="w-full gap-2 px-6 py-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Erneut abmelden
                  </Button>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
                  >
                    Zurück zum Dashboard
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
