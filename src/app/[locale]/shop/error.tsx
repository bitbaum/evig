'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('shop')

  useEffect(() => {
    logger.error('Shop error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="flex items-center justify-center py-24">
      <div className="card-shell max-w-md w-full p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg font-medium text-neutral-900 dark:text-white" role="alert">
          {t('error.title')}
        </Heading>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          {t('error.body')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('error.retry')}
          </button>
          <Link
            href={ROUTES.public.shop}
            className="inline-flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white min-h-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('error.backToShop')}
          </Link>
        </div>
      </div>
    </div>
  )
}
