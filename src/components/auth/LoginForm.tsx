'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Mail, Lock, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { sanitizeReturnTo } from '@/lib/utils/safe-redirect'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBanner } from '@/components/ui/status-banner'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'

/**
 * NextAuth error codes that map to translation keys for the user.
 * Anything not in this map shows the raw error string (server-formatted).
 * Connection-style errors are detected by substring (server may localize).
 */
const AUTH_ERROR_I18N_KEY: Record<string, 'errorCredentials' | 'errorAccessDenied' | 'errorOAuthLinked' | 'errorInvalidToken' | 'errorVerificationFailed' | 'errorVerificationError'> = {
  CredentialsSignin: 'errorCredentials',
  Configuration: 'errorCredentials',
  AccessDenied: 'errorAccessDenied',
  OAuthAccountNotLinked: 'errorOAuthLinked',
  invalid_token: 'errorInvalidToken',
  verification_failed: 'errorVerificationFailed',
  verification_error: 'errorVerificationError',
}

export function LoginForm() {
  const t = useTranslations('auth.login')
  const searchParams = useSearchParams()
  // Open-redirect guard: only same-origin paths pass through.
  const callbackUrl = sanitizeReturnTo(searchParams.get('callbackUrl'), '/dashboard')
  const queryError = searchParams.get('error')
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
    } catch {
      setFormError(t('errorUnexpected'))
    } finally {
      setIsLoading(false)
    }
  }

  const errorMessage = (() => {
    const error = formError || queryError
    if (!error) return null
    const i18nKey = AUTH_ERROR_I18N_KEY[error]
    if (i18nKey) return t(i18nKey)
    if (error.includes('Datenbankverbindung') || error.includes('connect') || error.includes('timeout')) {
      return t('errorConnection')
    }
    return error
  })()

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="card-shell rounded-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <Heading level={1} variant="admin" className="mb-2 text-center text-[2rem] font-semibold leading-tight text-text-primary sm:text-[2.25rem]">
            {t('heading')}
          </Heading>
          <p className="text-sm sm:text-base text-text-muted">
            {t('subtitle')}
          </p>
        </div>

        {verified && (
          <div className="mb-6">
            <StatusBanner variant="success">{t('emailVerifiedSuccess')}</StatusBanner>
          </div>
        )}

        {reset === 'success' && (
          <div className="mb-6">
            <StatusBanner variant="success">{t('passwordResetSuccess')}</StatusBanner>
          </div>
        )}

        {errorMessage && (
          <div id="login-error" className="mb-6 space-y-3">
            <StatusBanner variant="error">{errorMessage}</StatusBanner>
            {errorMessage.includes('bestätige') && email.trim() && (
              <p className="text-sm text-text-secondary">
                <Link
                  href={`${ROUTES.public.register}?email=${encodeURIComponent(email.trim())}`}
                  className="text-action hover:underline font-medium"
                >
                  Bestätigungscode eingeben oder erneut senden
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-text-secondary">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? 'login-error' : undefined}
                className="pl-11 pr-4 py-3 min-h-touch"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
                {t('password')}
              </label>
              <Link
                href={ROUTES.public.forgotPassword}
                className="text-sm text-action hover:text-action"
              >
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errorMessage}
                aria-describedby={errorMessage ? 'login-error' : undefined}
                className="pl-11 pr-12 py-3 min-h-touch"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                aria-pressed={showPassword}
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary h-auto w-auto p-0 bg-transparent hover:bg-transparent"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            className="w-full gap-2 font-semibold"
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
          </Button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-strong" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-surface-base text-text-tertiary">
              {t('newHere', { orgName: ORG.name })}
            </span>
          </div>
        </div>

        <Button
          as={Link}
          href={ROUTES.public.register}
          variant="outline"
          size="lg"
          className="w-full font-semibold border-2 border-action text-action hover:bg-action-muted"
        >
          {t('createAccount')}
        </Button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-text-secondary dark:text-text-muted mb-3">
          {t('benefits')}
        </p>
        <ul className="text-sm text-text-secondary dark:text-text-tertiary space-y-1">
          <li>✓ {t('benefit1')}</li>
          <li>✓ {t('benefit2')}</li>
          <li>✓ {t('benefit3')}</li>
          <li>✓ {t('benefit4')}</li>
        </ul>
      </div>
    </div>
  )
}
