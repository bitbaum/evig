'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'

export default function MarketplaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('errors')

  useEffect(() => {
    logger.error('Marketplace error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-neutral-900">
          {t('genericTitle')}
        </Heading>
        <p className="mt-2 text-sm text-neutral-600">
          {t('marketplace.description')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {t('retry')}
          </button>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center gap-2 text-neutral-600 hover:text-neutral-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('marketplace.back')}
          </Link>
        </div>
      </div>
    </div>
  )
}
