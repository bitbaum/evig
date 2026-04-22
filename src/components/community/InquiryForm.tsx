'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import Link from 'next/link'
import Heading from '@/components/ui/Heading'

interface InquiryFormProps {
  defaultThema?: string
  topicLabel?: string
}

export function InquiryForm({ defaultThema = '', topicLabel }: InquiryFormProps) {
  const t = useTranslations('getInvolved.kontakt.form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolvedTopic = topicLabel ?? t('submit')

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
      { method: 'POST', body: { name, email, message, topic: resolvedTopic } }
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
        <Heading level={2} className="text-gray-900 mb-2">{t('successHeading', { name })}</Heading>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {t('successText', { topic: resolvedTopic })}
        </p>
        <Link
          href="/get-involved"
          className="inline-flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-600"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('successBackLink')}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <input type="hidden" name="topic" value={defaultThema} />

      <div>
        <label htmlFor="inquiry-name" className="block text-sm font-medium text-gray-700 mb-1">
          {t('nameLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          minLength={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder={t('namePlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="inquiry-email" className="block text-sm font-medium text-gray-700 mb-1">
          {t('emailLabel')} <span className="text-red-500">*</span>
        </label>
        <input
          id="inquiry-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder={t('emailPlaceholder')}
        />
      </div>

      <div>
        <label htmlFor="inquiry-message" className="block text-sm font-medium text-gray-700 mb-1">
          {t('messageLabel')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="inquiry-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          minLength={20}
          rows={5}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          placeholder={t('messagePlaceholder')}
        />
        <p className="text-xs text-gray-400 mt-1">{t('charCount', { count: message.length })}</p>
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
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </button>

      <p className="text-xs text-gray-400 text-center">
        {t('responseNote')}
      </p>
    </form>
  )
}
