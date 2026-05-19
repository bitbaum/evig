'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { ROUTES } from '@/config/routes'

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('auth.error')

  useEffect(() => {
    logger.error('Auth error', { error, digest: error.digest })
  }, [error])

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg text-neutral-900">
          {t('heading')}
        </Heading>
        <p className="mt-2 text-sm text-neutral-600">
          {t('message')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full px-4 py-3 min-h-[44px] bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('retry')}
          </button>
          <Link
            href={ROUTES.public.login}
            className="text-sm text-neutral-600 hover:text-neutral-900 min-h-[44px] inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded"
          >
            {t('goToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
