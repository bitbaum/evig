'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/ui/Heading'
import { apiFetch } from '@/lib/api/client'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

function ResetPasswordContent() {
  const t = useTranslations('auth.resetPassword')
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  // Propagated through from the email link so that callers (e.g. the
  // IT-Hilfe anonymous-post claim flow) can land users on a specific
  // page after they sign in — not just the default post-login destination.
  const callbackUrl = searchParams.get('callbackUrl')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)

  // Validate token on page load
  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      setError(t('errorInvalidToken'))
      return
    }

    // You could add token validation here if needed
    setTokenValid(true)
  }, [token, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Validate passwords - matches AUTH_CONFIG (SSOT: minLength=8, no complexity)
    if (password.length < 8) {
      setError(t('errorTooShort'))
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t('errorMismatch'))
      setIsLoading(false)
      return
    }

    try {
      const result = await apiFetch<unknown>('/api/auth/reset-password', {
        method: 'POST',
        body: { token, password },
      })

      if (!result.success) {
        throw new Error(result.error || t('errorResetFailed'))
      }

      setSuccess(true)

      // Redirect to login after 3 seconds, preserving callbackUrl so the
      // user lands on their original destination after signing in.
      setTimeout(() => {
        const params = new URLSearchParams({ reset: 'success' })
        if (callbackUrl) params.set('callbackUrl', callbackUrl)
        router.push(`/auth/login?${params.toString()}`)
      }, 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : t('genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  if (!token || tokenValid === false) {
    return (
      <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-error-100 dark:bg-error-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-error-600" />
            </div>
          </div>
          <Heading level={2} className="mt-6 text-center text-3xl text-text-primary">
            {t('invalidLink')}
          </Heading>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {t('invalidLinkDesc')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface-base py-8 px-4 rounded-xl border border-strong sm:px-10 text-center">
            <div className="space-y-3">
              <Button as={Link} href={ROUTES.public.forgotPassword} variant="primary">
                {t('requestNewLink')}
              </Button>
              <p className="text-sm text-text-secondary">
                <Link href={ROUTES.public.login} className="text-action hover:text-action">
                  {t('backToLogin')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-action-muted rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-action" />
            </div>
          </div>
          <Heading level={2} className="mt-6 text-center text-3xl text-text-primary">
            {t('successHeading')}
          </Heading>
          <p className="mt-2 text-center text-sm text-text-secondary">
            {t('successDesc')}
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface-base py-8 px-4 rounded-xl border border-strong sm:px-10 text-center">
            <p className="text-sm text-text-secondary mb-6">
              {t('successRedirect')}
            </p>
            <Button
              as={Link}
              href={
                callbackUrl
                  ? `${ROUTES.public.login}?callbackUrl=${encodeURIComponent(callbackUrl)}`
                  : ROUTES.public.login
              }
              variant="primary"
            >
              {t('loginNow')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-text-secondary" />
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
        <div className="bg-surface-base py-8 px-4 rounded-xl border border-strong sm:px-10">
          {/* Error Message */}
          {error && (
            <div id="reset-password-error" className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
              <p className="text-sm text-error-700 dark:text-error-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1">
                {t('newPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'reset-password-error' : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 border border-default rounded-lg bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-transparent"
                  placeholder={t('newPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-secondary mb-1">
                {t('confirmPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'reset-password-error' : undefined}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-2.5 border border-default rounded-lg bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-transparent"
                  placeholder={t('confirmPasswordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="text-sm text-text-secondary space-y-1">
              <p className="font-medium">{t('requirementsTitle')}</p>
              <ul className="ml-4 space-y-0.5">
                <li className={password.length >= 8 ? 'text-action' : 'text-text-tertiary'}>
                  ✓ {t('requirementLength')}
                </li>
                <li className={password === confirmPassword && password ? 'text-action' : 'text-text-tertiary'}>
                  ✓ {t('requirementMatch')}
                </li>
              </ul>
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
        </div>
      </div>
    </div>
  )
}

function ResetPasswordFallback() {
  return (
    <div className="min-h-screen bg-surface-raised flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-surface-raised rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-text-secondary" />
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-base py-8 px-4 rounded-xl border border-strong sm:px-10">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-action animate-spin" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}
