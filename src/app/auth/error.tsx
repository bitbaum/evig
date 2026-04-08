'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Auth error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg text-gray-900">
          Authentifizierungsfehler
        </Heading>
        <p className="mt-2 text-sm text-gray-600">
          Beim Anmelden ist ein Fehler aufgetreten. Bitte versuche es erneut.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Erneut versuchen
          </button>
          <Link
            href="/auth/login"
            className="text-sm text-gray-600 hover:text-gray-900 min-h-[44px] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
          >
            Zur Anmeldeseite
          </Link>
        </div>
      </div>
    </div>
  )
}
