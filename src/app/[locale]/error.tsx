'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('error')

  useEffect(() => {
    logger.error('Application error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center py-24 px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-error-100 rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-error-600" />
        </div>
        <Heading level={1} className="text-2xl text-neutral-900 mb-2" role="alert">
          {t('title')}
        </Heading>
        <p className="text-neutral-600 mb-8">
          {t('description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="primary">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
          <Button as={Link} href="/" variant="outline">
            <Home className="w-4 h-4" />
            {t('goHome')}
          </Button>
        </div>
      </div>
    </div>
  )
}
