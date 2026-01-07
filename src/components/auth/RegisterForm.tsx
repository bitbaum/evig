'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { RoleSelector } from './RoleSelector'
import { ROLES } from '@/lib/constants'
import { getTextColor, getStatusColors, getButtonVariant } from '@/lib/design-system'
import { cn } from '@/lib/utils'

export function RegisterForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<string>(ROLES.CUSTOMER)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  // Password strength indicators (matching AUTH_CONFIG: 12 chars minimum)
  const passwordChecks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
  const passwordStrength = Object.values(passwordChecks).filter(Boolean).length
  const enableRoleSelection = process.env.NEXT_PUBLIC_ENABLE_ROLE_SELECTION_ON_REGISTER !== 'false'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrors(['Die Passwörter stimmen nicht überein'])
      setIsLoading(false)
      return
    }

    // Validate terms accepted
    if (!acceptTerms) {
      setErrors(['Bitte akzeptieren Sie die Allgemeinen Geschäftsbedingungen'])
      setIsLoading(false)
      return
    }

    try {
      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors(data.errors || [data.error || 'Registrierung fehlgeschlagen'])
        setIsLoading(false)
        return
      }

      setSuccess(true)
    } catch (error) {
      setErrors(['Ein unerwarteter Fehler ist aufgetreten'])
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Konto erstellt!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Wir haben Ihnen eine E-Mail mit einem Bestätigungslink gesendet. Bitte überprüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Link, um Ihr Konto zu aktivieren.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              <strong>Hinweis:</strong> Der Bestätigungslink ist 24 Stunden gültig. Falls Sie keine E-Mail erhalten haben, überprüfen Sie Ihren Spam-Ordner.
            </p>
          </div>
          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
              Zur Anmeldung
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Haben Sie bereits bestätigt? <Link href="/auth/login" className="text-green-600 hover:text-green-500">Jetzt anmelden</Link>
            </p>
          </div>
          <Loader2 className="w-6 h-6 animate-spin text-green-600 mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={cn('text-2xl font-bold mb-2', getTextColor('white', 'primary'), 'dark:text-white')}>
            Konto erstellen
          </h1>
          <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
            Werden Sie Teil der RevampIT-Community
          </p>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className={cn('mb-6 p-4 rounded-lg border-2', getStatusColors('error').bg, getStatusColors('error').border)}>
            <div className="flex items-start gap-3">
              <AlertCircle className={cn('w-5 h-5 flex-shrink-0 mt-0.5', getStatusColors('error').icon)} />
              <ul className={cn('text-sm space-y-1', getStatusColors('error').text)}>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
              Name <span className="text-neutral-400">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="Ihr Name"
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

          {/* Email */}
          <div>
            <label htmlFor="email" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
              E-Mail-Adresse *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@beispiel.ch"
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
            <label htmlFor="password" className={cn('block text-sm font-medium mb-1.5', getTextColor('white', 'secondary'), 'dark:text-neutral-300')}>
              Passwort *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
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
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${
                        passwordStrength >= level
                          ? level <= 2
                            ? 'bg-red-500'
                            : level === 3
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <li className={passwordChecks.length ? 'text-green-600' : ''}>
                    {passwordChecks.length ? '✓' : '○'} Mindestens 12 Zeichen
                  </li>
                  <li className={passwordChecks.uppercase ? 'text-green-600' : ''}>
                    {passwordChecks.uppercase ? '✓' : '○'} Ein Grossbuchstabe
                  </li>
                  <li className={passwordChecks.lowercase ? 'text-green-600' : ''}>
                    {passwordChecks.lowercase ? '✓' : '○'} Ein Kleinbuchstabe
                  </li>
                  <li className={passwordChecks.number ? 'text-green-600' : ''}>
                    {passwordChecks.number ? '✓' : '○'} Eine Zahl
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Passwort bestätigen *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                  confirmPassword && confirmPassword !== password
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="mt-1 text-xs text-red-500">Die Passwörter stimmen nicht überein</p>
            )}
          </div>

          {/* Role Selection (optional) */}
          {enableRoleSelection && (
            <div className="space-y-4">
              <RoleSelector
                selectedRole={role}
                onRoleChange={setRole}
                disabled={isLoading}
                variant="compact"
              />
            </div>
          )}

          {/* Terms */}
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
            />
            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
              Ich akzeptiere die{' '}
              <Link href="/agb" className="text-green-600 hover:underline">
                Allgemeinen Geschäftsbedingungen
              </Link>{' '}
              und die{' '}
              <Link href="/datenschutz" className="text-green-600 hover:underline">
                Datenschutzerklärung
              </Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || passwordStrength < 4 || password !== confirmPassword}
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
                <span>Wird registriert...</span>
              </>
            ) : (
              <>
                <span>Konto erstellen</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
              Bereits registriert?
            </span>
          </div>
        </div>

        {/* Login Link */}
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Anmelden
        </Link>
      </div>
    </div>
  )
}
