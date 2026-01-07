'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { LogOut, Loader2, CheckCircle2 } from 'lucide-react'

export default function LogoutPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggedOut, setIsLoggedOut] = useState(false)

  useEffect(() => {
    document.title = 'Abmelden | RevampIT'

    // Perform sign out
    const performSignOut = async () => {
      try {
        await signOut({ redirect: false })
        setIsLoggedOut(true)
      } catch {
        // Even if there's an error, consider user logged out
        setIsLoggedOut(true)
      } finally {
        setIsLoading(false)
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
            {isLoading ? (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Abmeldung läuft...
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Bitte warten Sie einen Moment.
                </p>
              </>
            ) : isLoggedOut ? (
              <>
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Erfolgreich abgemeldet
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Sie wurden erfolgreich von Ihrem Konto abgemeldet.
                </p>
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
                  >
                    Zur Startseite
                  </Link>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Erneut anmelden
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogOut className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Abmelden
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Möchten Sie sich wirklich abmelden?
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
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
