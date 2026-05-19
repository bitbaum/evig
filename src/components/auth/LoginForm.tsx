'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { getTextColor, getStatusColors, getButtonVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'

export function LoginForm() {
  const t = useTranslations('auth.login')
  const searchParams = useSearchParams()
  // Prevent open redirect: only allow same-origin paths
  const callbackUrl = sanitizeReturnTo(searchParams.get('callbackUrl'), '/dashboard')
  const error = searchParams.get('error')
  const verified = searchParams.get('verified')
  const reset = searchParams.get('reset')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setFormError(result.error)
        return
      }

      if (result?.url) {
        const url = new URL(result.url, window.location.origin)
        window.location.assign(`${url.pathname}${url.search}${url.hash}`)
        return
      }

      window.location.assign(callbackUrl)
    } catch (error) {
      setFormError(t('errorUnexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string | null) => {
    if (!error) return null
    type AuthLoginKey = Parameters<typeof t>[0]
    const AUTH_ERROR_I18N_KEY: Record<string, AuthLoginKey> = {
      CredentialsSignin: 'errorCredentials',
      Configuration: 'errorCredentials',
      AccessDenied: 'errorAccessDenied',
      OAuthAccountNotLinked: 'errorOAuthLinked',
      invalid_token: 'errorInvalidToken',
      verification_failed: 'errorVerificationFailed',
      verification_error: 'errorVerificationError',
    }
    const i18nKey = AUTH_ERROR_I18N_KEY[error]
    if (i18nKey) return t(i18nKey)
    if (error.includes('Datenbankverbindung') || error.includes('connect') || error.includes('timeout')) {
      return t('errorConnection')
    }
    return error
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card-shell rounded-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Heading level={1} className={cn('text-2xl font-bold mb-2', getTextColor('white', 'primary'), 'dark:text-white')}>
            {t('heading')}
          </Heading>
          <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
            {t('subtitle')}
          </p>
        </div>

        {/* Success Messages */}
        {verified && (
          <div className={cn('mb-6 p-4 rounded-lg flex items-start gap-3 border-2', getStatusColors('success').bg, getStatusColors('success').border)}>
            <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0 mt-0.5', getStatusColors('success').icon)} />
            <p className={cn('text-sm', getStatusColors('success').text)}>
              {t('emailVerifiedSuccess')}
            </p>
          </div>
        )}

        {reset === 'success' && (
          <div className={cn('mb-6 p-4 rounded-lg flex items-start gap-3 border-2', getStatusColors('success').bg, getStatusColors('success').border)}>
            <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0 mt-0.5', getStatusColors('success').icon)} />
            <p className={cn('text-sm', getStatusColors('success').text)}>
              {t('passwordResetSuccess')}
            </p>
          </div>
        )}

        {/* Error Messages */}
        {(formError || error) && (
          <div
            id="login-error"
            role="alert"
            aria-live="assertive"
            className={cn('mb-6 p-4 rounded-lg flex items-start gap-3 border-2', getStatusColors('error').bg, getStatusColors('error').border)}
          >
            <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', getStatusColors('error').icon)} />
            <p className={cn('text-sm', getStatusColors('error').text)}>
              {getErrorMessage(formError || error)}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-invalid={!!(formError || error)}
                aria-describedby={(formError || error) ? 'login-error' : undefined}
                className={cn(
                  'w-full pl-11 pr-4 py-3 border-2 rounded-lg transition-all min-h-[touch] touch-target',
                  'border-neutral-300 dark:border-neutral-600',
                  'bg-white dark:bg-neutral-700',
                  getTextColor('white', 'primary'),
                  'dark:text-white',
                  'placeholder-neutral-400',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                )}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className={cn('block text-sm font-medium', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
                {t('password')}
              </label>
              <Link
                href={ROUTES.public.forgotPassword}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!(formError || error)}
                aria-describedby={(formError || error) ? 'login-error' : undefined}
                className={cn(
                  'w-full pl-11 pr-12 py-3 border-2 rounded-lg transition-all min-h-[touch] touch-target',
                  'border-neutral-300 dark:border-neutral-600',
                  'bg-white dark:bg-neutral-700',
                  getTextColor('white', 'primary'),
                  'dark:text-white',
                  'placeholder-neutral-400',
                  'focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors min-h-[touch] touch-target',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              getButtonVariant('primary').bg,
              getButtonVariant('primary').text,
              getButtonVariant('primary').hover
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('signingIn')}</span>
              </>
            ) : (
              <>
                <span>{t('submit')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-neutral-800 text-neutral-500">
              {t('newHere', { orgName: ORG.name })}
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link
          href={ROUTES.public.register}
          className="w-full flex items-center justify-center gap-2 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {t('createAccount')}
        </Link>
      </div>

      {/* Benefits */}
      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
          {t('benefits')}
        </p>
        <ul className="text-sm text-neutral-600 dark:text-neutral-500 space-y-1">
          <li>✓ {t('benefit1')}</li>
          <li>✓ {t('benefit2')}</li>
          <li>✓ {t('benefit3')}</li>
          <li>✓ {t('benefit4')}</li>
        </ul>
      </div>
    </div>
  )
}
