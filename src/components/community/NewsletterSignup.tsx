'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'

interface NewsletterSignupProps {
  title?: string
  description?: string
  source?: string
  /** dark = for use on dark backgrounds (footer) */
  variant?: 'light' | 'dark'
}

export function NewsletterSignup({
  title,
  description,
  source = 'website',
  variant = 'light',
}: NewsletterSignupProps) {
  const t = useTranslations('home.newsletter')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const resolvedTitle = title ?? t('title')
  const resolvedDescription = description ?? t('subtitle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setErrorMsg('')

    try {
      const { error: apiError } = await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: { email, name: name || undefined, source },
      })

      if (!apiError) {
        setStatus('success')
      } else {
        setErrorMsg(apiError)
        setStatus('error')
      }
    } catch {
      setErrorMsg(t('networkError'))
      setStatus('error')
    }
  }

  const isDark = variant === 'dark'

  if (status === 'success') {
    return (
      <div className={`rounded-lg p-4 text-sm ${isDark ? 'bg-green-900/40 text-green-300' : 'bg-green-50 text-green-700'}`}>
        {t('successMessage')}
      </div>
    )
  }

  return (
    <div>
      {(resolvedTitle || resolvedDescription) && (
        <div className="mb-3">
          {resolvedTitle && (
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {resolvedTitle}
            </p>
          )}
          {resolvedDescription && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {resolvedDescription}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
            isDark
              ? 'border-gray-600 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-900'
          } sm:max-w-[140px]`}
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
            isDark
              ? 'border-gray-600 bg-gray-800 text-white'
              : 'border-gray-300 bg-white text-gray-900'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-10 rounded-md bg-green-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </button>
      </form>

      {status === 'error' && (
        <p className={`mt-2 text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
