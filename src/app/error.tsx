'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Application error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-error-100 rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-error-600" />
        </div>
        <Heading level={1} className="text-2xl text-neutral-900 mb-2" role="alert">
          Etwas ist schiefgelaufen
        </Heading>
        <p className="text-neutral-600 mb-8">
          Ein unerwarteter Fehler ist aufgetreten. Versuche die Seite neu zu laden — falls das Problem weiterhin besteht, kontaktiere uns.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-neutral-700 font-medium rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
