'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'

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
      <div className="max-w-md w-full bg-surface-base shadow-lg dark:shadow-black/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-text-primary" role="alert">
          Etwas ist schiefgelaufen
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          Beim Laden der Admin-Seite ist ein Fehler aufgetreten.
        </p>
        <Button onClick={reset} variant="primary" className="mt-6 w-full min-h-[44px]">
          Erneut versuchen
        </Button>
      </div>
    </div>
  )
}
