'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

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
          <Button onClick={reset} variant="primary">
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </Button>
          <Button as={Link} href="/" variant="outline">
            <Home className="w-4 h-4" />
            Zur Startseite
          </Button>
        </div>
      </div>
    </div>
  )
}
