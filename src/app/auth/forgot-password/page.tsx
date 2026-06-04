'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { apiFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgotPassword')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiFetch<unknown>('/api/auth/forgot-password', {
        method: 'POST',
        body: { email },
      })

      if (!result.success) {
        throw new Error(result.error || t('resetFailed'))
      }

      setSuccess(true)
    } catch (error) {
      setError(error instanceof Error ? error.message : t('genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-primary-600" />
            </div>
          </div>
          <Heading level={2} className="mt-6 text-center text-3xl text-neutral-900">
            {t('successHeading')}
          </Heading>
          <p className="mt-2 text-center text-sm text-neutral-600">
            {t('successSubheading')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-neutral-800 py-8 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 sm:px-10">
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-6">
                {t('successInstructions')}
              </p>

              <div className="space-y-3">
                <Button as={Link} href={ROUTES.public.login} variant="primary">
                  {t('successLoginLink')}
                </Button>
                <p className="text-sm text-neutral-500">
                  <button
                    onClick={() => setSuccess(false)}
                    className="text-primary-600 hover:text-primary-500"
                  >
                    {t('successOtherEmail')}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-neutral-600" />
          </div>
        </div>
        <Heading level={2} className="mt-6 text-center text-3xl text-neutral-900">
          {t('heading')}
        </Heading>
        <p className="mt-2 text-center text-sm text-neutral-600">
          {t('subheading')}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-neutral-800 py-8 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 sm:px-10">
          <Link
            href={ROUTES.public.login}
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToLogin')}
          </Link>

          {/* Error Message */}
          {error && (
            <div id="email-error" className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
              <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                {t('emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder={t('emailPlaceholder')}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full gap-2 py-2.5">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('submitLoading')}
                </>
              ) : (
                t('submit')
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {t('rememberPassword')}{' '}
              <Link href={ROUTES.public.login} className="font-medium text-primary-600 hover:text-primary-700">
                {t('loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
