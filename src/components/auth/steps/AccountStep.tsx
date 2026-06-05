'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUTH_CONFIG } from '@/lib/auth/config'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Single source: same config the server's RegisterSchema derives from
// (lib/schemas/auth.ts:createPasswordSchema). If the policy changes —
// minLength becomes 10, complexity is added — the client UI updates
// automatically. Note: we deliberately don't surface complexity hints
// even if AUTH_CONFIG grows them, because forced complexity makes
// password creation worse, not safer. See bcrypt + zxcvbn literature.
const PASSWORD_MIN_LENGTH = AUTH_CONFIG.password.minLength

interface AccountStepProps {
  name: string
  email: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
  onNameChange: (name: string) => void
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onConfirmPasswordChange: (confirmPassword: string) => void
  onAcceptTermsChange: (accept: boolean) => void
  onNext: () => void
  onBack?: () => void
  isLoading?: boolean
  errors?: string[]
}

export function AccountStep({
  name,
  email,
  password,
  confirmPassword,
  acceptTerms,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAcceptTermsChange,
  onNext,
  onBack,
  isLoading = false,
  errors = []
}: AccountStepProps) {
  const t = useTranslations('auth.register')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Derived from AUTH_CONFIG (SSOT). One check by design — RevampIT's
  // password policy is intentionally simple (8 chars, no complexity rules).
  const passwordChecks = {
    length: password.length >= PASSWORD_MIN_LENGTH,
  }
  const passwordValid = passwordChecks.length
  const passwordsMatch = password === confirmPassword
  const isValid = email && passwordValid && passwordsMatch && acceptTerms

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid && !isLoading) {
      onNext()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center mb-6">
        <Heading level={2} className="text-xl font-bold text-text-primary mb-2">
          {t('heading')}
        </Heading>
        <p className="text-text-secondary dark:text-text-muted">
          {t('subtitle')}
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div id="account-errors" className="p-4 rounded-lg border-2 bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800/30">
          <ul className="text-sm text-error-700 dark:text-error-400 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5 text-text-secondary">
          {t('nameLabel')} <span className="text-text-muted">{t('nameOptional')}</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            className="pl-11 pr-4 py-3 border-2 border-default rounded-lg"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-text-secondary">
          {t('email')} *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="email"
            placeholder={t('emailPlaceholder')}
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? 'account-errors' : undefined}
            className="pl-11 pr-4 py-3 border-2 border-default rounded-lg"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-text-secondary">
          {t('password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="new-password"
            placeholder={t('passwordPlaceholder')}
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? 'account-errors' : undefined}
            className="pl-11 pr-12 py-3 border-2 border-default rounded-lg"
          />
          <Button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </Button>
        </div>

        {/* Password Strength */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-2">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  passwordChecks.length ? 'bg-action' : 'bg-surface-overlay'
                }`}
              />
            </div>
            <ul className="text-xs text-text-tertiary space-y-0.5">
              <li className={passwordChecks.length ? 'text-action' : ''}>
                {passwordChecks.length ? '✓' : '○'} {t('passwordMin')}
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-text-secondary">
          {t('confirmPassword')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="new-password"
            placeholder={t('confirmPasswordPlaceholder')}
            aria-invalid={!!(confirmPassword && !passwordsMatch)}
            aria-describedby={confirmPassword && !passwordsMatch ? 'confirmPassword-error' : undefined}
            className={cn(
              'pl-11 pr-12 py-3 border-2 rounded-lg',
              confirmPassword && !passwordsMatch ? 'border-error-500' : 'border-default'
            )}
          />
          <Button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </Button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p id="confirmPassword-error" className="mt-1 text-xs text-error-500">{t('passwordMismatch')}</p>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3">
        <input
          id="terms"
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => onAcceptTermsChange(e.target.checked)}
          aria-required="true"
          className="mt-1 w-4 h-4 rounded-sm border-default text-action focus:ring-action"
        />
        <label htmlFor="terms" className="text-sm text-text-secondary dark:text-text-muted">
          {t('termsI')}{' '}
          <Link href="/agb" className="text-action hover:underline">
            {t('agb')}
          </Link>{' '}
          {t('termsAnd')}{' '}
          <Link href="/datenschutz" className="text-action hover:underline">
            {t('datenschutz')}
          </Link>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        {onBack && (
          <Button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            variant="outline"
            size="lg"
            className="gap-2 border-2 border-default text-text-secondary hover:bg-surface-raised"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || isLoading}
          variant="primary"
          size="lg"
          className="flex-1 gap-2 font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{t('creating')}</span>
            </>
          ) : (
            <>
              <span>{t('submit')}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
