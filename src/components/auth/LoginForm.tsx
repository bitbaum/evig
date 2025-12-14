'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Loader2, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')
  const verified = searchParams.get('verified')
  const reset = searchParams.get('reset')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
        redirect: false,
      })

      if (result?.error) {
        // Ask server for a precise reason to improve UX
        try {
          const statusResp = await fetch('/api/auth/login-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          if (statusResp.ok) {
            const s = await statusResp.json()
            if (!s.exists) {
              setFormError('Kein Konto mit dieser E-Mail gefunden')
            } else if (!s.emailVerified) {
              setFormError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse')
            } else if (!s.hasPassword) {
              setFormError('Dieses Konto verwendet eine andere Anmeldemethode')
            } else if (s.locked) {
              setFormError('Konto vorübergehend gesperrt. Bitte versuchen Sie es später erneut.')
            } else {
              setFormError('Falsches Passwort')
            }
          } else {
            setFormError(result.error)
          }
        } catch {
          setFormError(result.error)
        }
      } else if (result?.ok) {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (error) {
      setFormError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string | null) => {
    if (!error) return null
    switch (error) {
      case 'CredentialsSignin':
        return 'Ungültige Anmeldedaten'
      case 'Configuration':
        return 'Anmeldung fehlgeschlagen (Konfiguration). Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.'
      case 'OAuthAccountNotLinked':
        return 'Diese E-Mail ist bereits mit einem anderen Konto verknüpft'
      case 'invalid_token':
        return 'Ungültiger Verifizierungslink'
      case 'verification_failed':
        return 'E-Mail-Verifizierung fehlgeschlagen. Der Link könnte abgelaufen sein.'
      case 'verification_error':
        return 'Ein Fehler ist bei der E-Mail-Verifizierung aufgetreten'
      default:
        return error
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Willkommen zurück
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Melden Sie sich in Ihrem Konto an
          </p>
        </div>

        {/* Success Messages */}
        {verified && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">
              E-Mail-Adresse erfolgreich bestätigt! Sie können sich jetzt anmelden.
            </p>
          </div>
        )}

        {reset === 'success' && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Ihr Passwort wurde erfolgreich geändert! Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </p>
          </div>
        )}

        {/* Error Messages */}
        {(formError || error) && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">
              {getErrorMessage(formError || error)}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="name@beispiel.ch"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Passwort
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
              >
                Passwort vergessen?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Wird angemeldet...</span>
              </>
            ) : (
              <>
                <span>Anmelden</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Forgot Password Link */}
        <div className="text-center mt-4">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
          >
            Passwort vergessen?
          </Link>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
              Neu bei RevampIT?
            </span>
          </div>
        </div>

        {/* Register Link */}
        <Link
          href="/auth/register"
          className="w-full flex items-center justify-center gap-2 border-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Konto erstellen
        </Link>
      </div>

      {/* Benefits */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Mit einem Konto können Sie:
        </p>
        <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
          <li>✓ Sich für Workshops anmelden</li>
          <li>✓ Termine für Dienstleistungen buchen</li>
          <li>✓ Ihre Bestellungen im Shop verfolgen</li>
          <li>✓ Ihre Spenden und Aktivitäten verwalten</li>
        </ul>
      </div>
    </div>
  )
}

