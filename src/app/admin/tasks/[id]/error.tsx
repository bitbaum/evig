'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/config/routes'

export default function TaskDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    logger.error('Task detail error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md w-full bg-surface-base border border-subtle rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-text-primary" role="alert">
          Fehler beim Laden der Aufgabe
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          Die Aufgabendetails konnten nicht geladen werden.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full min-h-touch">
            Erneut versuchen
          </Button>
          <Link
            href={ROUTES.admin.tasks}
            className="text-sm text-text-secondary hover:text-text-primary min-h-touch inline-flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 rounded-sm"
          >
            Zurück zur Aufgabenliste
          </Link>
        </div>
      </div>
    </div>
  )
}
