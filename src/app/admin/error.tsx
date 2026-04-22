'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/admin/AdminHeading'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Admin error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-gray-900" role="alert">
          Etwas ist schiefgelaufen
        </Heading>
        <p className="mt-2 text-sm text-gray-600">
          Beim Laden der Admin-Seite ist ein Fehler aufgetreten.
        </p>
        <button
          onClick={reset}
          className="mt-6 w-full px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          Erneut versuchen
        </button>
      </div>
    </div>
  )
}
