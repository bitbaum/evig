'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

export default function ProfilError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Profil error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-surface-raised flex items-center justify-center">
      <div className="max-w-md w-full bg-surface-base shadow-lg dark:shadow-black/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg text-text-primary">
          Etwas ist schiefgelaufen
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          Beim Laden deines Profils ist ein Fehler aufgetreten.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full min-h-touch">
            Erneut versuchen
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 text-text-secondary hover:text-neutral-900 min-h-touch focus:outline-hidden focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Zurück zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
