'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'

export default function ListingDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Listing detail error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="text-lg font-medium text-gray-900" role="alert">
          Fehler beim Laden des Inserats
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Das Inserat konnte nicht geladen werden.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            Erneut versuchen
          </button>
          <Link
            href="/marketplace"
            className="text-sm text-gray-600 hover:text-gray-900 min-h-[44px] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
          >
            Zurück zum Marktplatz
          </Link>
        </div>
      </div>
    </div>
  )
}
