'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { apiFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const t = useTranslations('auth.verifyEmail')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')

      if (!token) {
        setStatus('error')
        setMessage(t('noToken'))
        return
      }

      const result = await apiFetch<{ message: string }>('/api/auth/verify-email', {
        method: 'POST',
        body: { token },
      })

      if (result.success && result.data) {
        setStatus('success')
        setMessage(result.data.message)

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?verified=true')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(result.error || t('genericError'))
      }
    }

    verifyEmail()
  }, [searchParams, router, t])

  return (
    <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-action" />
          </div>
        </div>
        <Heading level={2} className="mt-6 text-center text-3xl text-text-primary">
          {t('heading')}
        </Heading>
        <p className="mt-2 text-center text-sm text-text-secondary">
          {t('subheading')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-base py-8 px-4 shadow-lg dark:shadow-black/30 rounded-lg sm:px-10">
          <div className="text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-action animate-spin mb-4" />
                <p className="text-text-secondary">{t('loading')}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center">
                <CheckCircle className="w-12 h-12 text-action mb-4" />
                <Heading level={3} className="text-lg text-action mb-2">
                  {t('successHeading')}
                </Heading>
                <p className="text-text-secondary mb-4">{message}</p>
                <p className="text-sm text-text-tertiary">
                  {t('successRedirect')}
                </p>
                <div className="mt-6">
                  <Link
                    href={ROUTES.public.login}
                    className="text-action hover:text-action font-medium"
                  >
                    {t('successLogin')}
                  </Link>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center">
                <XCircle className="w-12 h-12 text-error-500 mb-4" />
                <Heading level={3} className="text-lg text-error-900 mb-2">
                  {t('errorHeading')}
                </Heading>
                <p className="text-text-secondary mb-4">{message}</p>
                <div className="space-y-3">
                  <Button as={Link} href={ROUTES.public.login} variant="primary">
                    {t('errorLogin')}
                  </Button>
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-action hover:text-action"
                    >
                      {t('errorRetry')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-action" />
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-base py-8 px-4 shadow-lg dark:shadow-black/30 rounded-lg sm:px-10">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-action animate-spin" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
