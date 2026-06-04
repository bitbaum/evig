'use client'

import React, { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor, getButtonVariant } from '@/lib/design-system'
import Heading from '@/components/ui/Heading'

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

  // Password strength indicators - derived from AUTH_CONFIG (SSOT)
  // AUTH_CONFIG: minLength=8, no complexity requirements
  const passwordChecks = {
    length: password.length >= 8,
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
        <label htmlFor="name" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          {t('nameLabel')} <span className="text-text-muted">{t('nameOptional')}</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="name"
            placeholder={t('namePlaceholder')}
            className="w-full pl-11 pr-4 py-3 border-2 rounded-lg border-neutral-300 bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-action"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          {t('email')} *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
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
            className="w-full pl-11 pr-4 py-3 border-2 rounded-lg border-neutral-300 bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-action"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          {t('password')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
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
            className="w-full pl-11 pr-12 py-3 border-2 rounded-lg border-neutral-300 bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-action"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Password Strength */}
        {password && (
          <div className="mt-2">
            <div className="flex gap-1 mb-2">
              <div
                className={`h-1.5 flex-1 rounded-full ${
                  passwordChecks.length ? 'bg-action' : 'bg-neutral-200'
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
        <label htmlFor="confirmPassword" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          {t('confirmPassword')} *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
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
              'w-full pl-11 pr-12 py-3 border-2 rounded-lg bg-surface-base text-text-primary placeholder-neutral-400 focus:ring-2 focus:ring-action focus:border-action',
              confirmPassword && !passwordsMatch ? 'border-error-500' : 'border-neutral-300'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
            aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
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
          className="mt-1 w-4 h-4 rounded-sm border-neutral-300 text-action focus:ring-action"
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
          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-neutral-300 text-text-secondary rounded-lg hover:bg-surface-raised transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('back')}</span>
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isLoading}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-lg transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            getButtonVariant('primary').bg,
            getButtonVariant('primary').text,
            getButtonVariant('primary').hover
          )}
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
        </button>
      </div>
    </form>
  )
}
