'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor, getButtonVariant } from '@/lib/design-system'

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
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Konto erstellen
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Geben Sie Ihre Daten ein
        </p>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div id="account-errors" className="p-4 rounded-lg border-2 bg-red-50 border-red-200">
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          Name <span className="text-neutral-400">(optional)</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoComplete="name"
            placeholder="Ihr Name"
            className="w-full pl-11 pr-4 py-3 border-2 rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          E-Mail-Adresse *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="email"
            placeholder="name@beispiel.ch"
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? 'account-errors' : undefined}
            className="w-full pl-11 pr-4 py-3 border-2 rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          Passwort *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="new-password"
            placeholder="Mindestens 8 Zeichen"
            aria-invalid={errors.length > 0}
            aria-describedby={errors.length > 0 ? 'account-errors' : undefined}
            className="w-full pl-11 pr-12 py-3 border-2 rounded-lg border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
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
                  passwordChecks.length ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            </div>
            <ul className="text-xs text-gray-500 space-y-0.5">
              <li className={passwordChecks.length ? 'text-green-600' : ''}>
                {passwordChecks.length ? '✓' : '○'} Mindestens 8 Zeichen
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirmPassword" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
          Passwort bestätigen *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
            aria-required="true"
            autoComplete="new-password"
            placeholder="Passwort wiederholen"
            aria-invalid={!!(confirmPassword && !passwordsMatch)}
            aria-describedby={confirmPassword && !passwordsMatch ? 'confirmPassword-error' : undefined}
            className={cn(
              'w-full pl-11 pr-12 py-3 border-2 rounded-lg bg-white dark:bg-neutral-700 text-gray-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              confirmPassword && !passwordsMatch ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-600'
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label={showConfirmPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {confirmPassword && !passwordsMatch && (
          <p id="confirmPassword-error" className="mt-1 text-xs text-red-500">Die Passwörter stimmen nicht überein</p>
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
          className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
          Ich akzeptiere die{' '}
          <Link href="/agb" className="text-green-600 hover:underline">
            AGB
          </Link>{' '}
          und die{' '}
          <Link href="/datenschutz" className="text-green-600 hover:underline">
            Datenschutzerklärung
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
            className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Zurück</span>
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
              <span>Wird erstellt...</span>
            </>
          ) : (
            <>
              <span>Konto erstellen</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}
