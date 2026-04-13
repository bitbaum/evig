'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import Heading from '@/components/ui/Heading'

interface InquiryFormProps {
  defaultThema?: string
  topicLabel?: string
}

export function InquiryForm({ defaultThema = '', topicLabel = 'Mitmachen' }: InquiryFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    !submitting &&
    name.trim().length >= 2 &&
    /\S+@\S+\.\S+/.test(email) &&
    message.trim().length >= 20

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    const { error: apiError } = await apiFetch<{ message: string }>(
      '/api/inquiry',
      { method: 'POST', body: { name, email, message, topic: topicLabel } }
    )

    setSubmitting(false)

    if (apiError) {
      setError(apiError)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <Heading level={2} className="text-gray-900 mb-2">Danke, {name}!</Heading>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Wir haben deine Anfrage zu <strong>{topicLabel}</strong> erhalten und melden uns in Kürze bei dir.
        </p>
        <Link
          href="/get-involved"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Weitere Mitmach-Möglichkeiten entdecken
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="topic" value={defaultThema} />

      <div>
        <label htmlFor="inquiry-name" className="block text-sm font-medium text-gray-700 mb-1">
          Dein Name <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Vorname Nachname"
        />
      </div>

      <div>
        <label htmlFor="inquiry-email" className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail-Adresse <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="deine@email.ch"
        />
      </div>

      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium text-gray-700 mb-1">
          Deine Nachricht <span className="text-red-500">*</span>
        </label>
        <textarea
          id="inquiry-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          minLength={20}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder="Erzähl uns kurz, wer du bist und was dich interessiert…"
        />
        <p className="text-xs text-gray-400 mt-1">{message.length}/2000 Zeichen (min. 20)</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Wird gesendet…
          </>
        ) : (
          'Anfrage senden'
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Wir antworten in der Regel innerhalb weniger Werktage.
      </p>
    </form>
  )
}
