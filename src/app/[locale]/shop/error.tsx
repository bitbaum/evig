'use client'

import { useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
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
        <Heading level={1} className="text-lg font-medium text-text-primary" role="alert">
          {t('error.title')}
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          {t('error.body')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full">
            {t('error.retry')}
          </Button>
          <Link
            href={ROUTES.public.shop}
            className="inline-flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary min-h-touch focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            {t('error.backToShop')}
          </Link>
        </div>
      </div>
    </div>
  )
}
