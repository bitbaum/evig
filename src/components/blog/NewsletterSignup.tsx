'use client'

import { useState } from 'react'
import { Mail, Heart, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const { error: apiError } = await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: { email },
      })

      if (!apiError) {
        setStatus('success')
        setMessage('Willkommen! Überprüfen Sie Ihre E-Mail.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(apiError)
      }
    } catch {
      setStatus('error')
      setMessage('Verbindungsfehler. Bitte versuchen Sie es später erneut.')
    }
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12">
      <div className="border-t border-b border-gray-200 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Hat Ihnen dieser Artikel gefallen?
          </h3>
          <p className="text-lg text-gray-600 leading-relaxed">
            Erhalten Sie wöchentlich qualitativ hochwertige Artikel über nachhaltige Technologie,
            Open Source und die Zukunft des Computing – direkt in Ihren Posteingang.
          </p>
        </div>

        {/* Newsletter Promise */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">100% kostenlos</p>
                <p className="text-gray-600">Keine versteckten Kosten</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Keine Werbung</p>
                <p className="text-gray-600">Nur wertvoller Inhalt</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Jederzeit abmelden</p>
                <p className="text-gray-600">Ein Klick genügt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        {status === 'success' ? (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
              <Check className="w-6 h-6 text-primary-600" />
            </div>
            <p className="text-primary-800 font-semibold mb-1">{message}</p>
            <p className="text-primary-700 text-sm">
              Bitte bestätigen Sie Ihre E-Mail-Adresse, um den Newsletter zu aktivieren.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ihre.email@beispiel.de"
                required
                aria-required="true"
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                disabled={status === 'loading'}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold whitespace-nowrap"
              >
                {status === 'loading' ? 'Sende...' : 'Abonnieren'}
              </button>
            </div>

            {status === 'error' && (
              <p id="newsletter-error" className="text-red-600 text-sm">{message}</p>
            )}

            <p className="text-xs text-gray-500 text-center">
              Wir respektieren Ihre Privatsphäre. Keine Spam-Mails, versprochen.
            </p>
          </form>
        )}

        {/* Community Support */}
        <div className="mt-8 pt-8 border-t border-gray-200 text-center">
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <Heart className="w-5 h-5 text-red-500" />
            <p className="text-sm">
              <strong>Community-gestützt.</strong> Kein Werbemodell.
            </p>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Wir glauben an qualitativ hochwertige, wahrheitsgetreue Inhalte ohne Werbung.
            Wenn Sie unsere Arbeit schätzen, können Sie uns gerne unterstützen.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Heart className="w-4 h-4" />
            RevampIt unterstützen
          </a>
        </div>
      </div>
    </div>
  )
}
