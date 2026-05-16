'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Dashboard error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 shadow-lg dark:shadow-black/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-neutral-900 dark:text-white" role="alert">
          Etwas ist schiefgelaufen
        </Heading>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Beim Laden des Dashboards ist ein Fehler aufgetreten.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Erneut versuchen
          </button>
          <Link
            href="/dashboard"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 min-h-[44px] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
