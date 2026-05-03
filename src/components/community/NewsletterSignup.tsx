'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

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
    } catch (err) {
      logger.warn('Newsletter signup failed', { error: err })
      setErrorMsg(t('networkError'))
      setStatus('error')
    }
  }

  const isDark = variant === 'dark'

  if (status === 'success') {
    return (
      <div className={`rounded-lg p-4 text-sm ${isDark ? 'bg-primary-900/40 text-primary-300' : 'bg-primary-50 text-primary-700'}`}>
        {t('successMessage')}
      </div>
    )
  }

  return (
    <div>
      {(resolvedTitle || resolvedDescription) && (
        <div className="mb-3">
          {resolvedTitle && (
            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {resolvedTitle}
            </p>
          )}
          {resolvedDescription && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
              {resolvedDescription}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <label htmlFor="newsletter-name" className="sr-only">{t('namePlaceholder')}</label>
        <input
          id="newsletter-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            isDark
              ? 'border-neutral-600 bg-neutral-800 text-white'
              : 'border-neutral-300 bg-white text-neutral-900'
          } sm:max-w-[140px]`}
        />
        <label htmlFor="newsletter-email" className="sr-only">{t('emailPlaceholder')}</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
            isDark
              ? 'border-neutral-600 bg-neutral-800 text-white'
              : 'border-neutral-300 bg-white text-neutral-900'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-10 rounded-md bg-primary-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-60 whitespace-nowrap"
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
