'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'

export default function ReviewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Reviews error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-surface-base dark:bg-neutral-800 shadow-lg dark:shadow-black/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-text-primary" role="alert">
          Fehler beim Laden der Bewertungen
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          Die Bewertungsübersicht konnte nicht geladen werden.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full min-h-[44px]">
            Erneut versuchen
          </Button>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-neutral-900 dark:hover:text-neutral-200 min-h-[44px] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
