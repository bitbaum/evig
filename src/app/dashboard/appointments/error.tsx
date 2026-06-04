'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

export default function AppointmentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Appointments error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-surface-base shadow-lg dark:shadow-black/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-text-primary" role="alert">
          Fehler beim Laden der Termine
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          Die Terminübersicht konnte nicht geladen werden.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full min-h-touch">
            Erneut versuchen
          </Button>
          <Link
            href="/dashboard"
            className="text-sm text-text-secondary hover:text-text-primary min-h-touch inline-flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 rounded-sm"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
