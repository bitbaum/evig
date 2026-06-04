'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-surface-raised flex items-center justify-center">
      <div className="max-w-md w-full bg-surface-base rounded-xl border border-strong p-6 text-center">
        <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" aria-hidden="true" />
        <Heading level={1} className="text-lg text-text-primary">
          {t('heading')}
        </Heading>
        <p className="mt-2 text-sm text-text-secondary">
          {t('message')}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={reset} variant="primary" className="w-full min-h-touch">
            {t('retry')}
          </Button>
          <Link
            href={ROUTES.public.login}
            className="text-sm text-text-secondary hover:text-text-primary min-h-touch inline-flex items-center justify-center focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 rounded-sm"
          >
            {t('goToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
