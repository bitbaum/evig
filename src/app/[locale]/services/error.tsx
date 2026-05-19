'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function ServicesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    logger.error('Services error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center py-24">
      <div className="card-shell max-w-md w-full p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-neutral-900" role="alert">
          {t('genericTitle')}
        </Heading>
        <p className="mt-2 text-sm text-neutral-600">
          {t('services.description')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full">
            {t('retry')}
          </Button>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 text-neutral-600 hover:text-neutral-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('services.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
