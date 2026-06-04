'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { Button } from '@/components/ui/button'

interface NewsletterSignupProps {
  title?: string
  description?: string
  source?: string
}

export function NewsletterSignup({
  title,
  description,
  source = 'website',
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

  if (status === 'success') {
    return (
      <div className="rounded-lg p-4 text-sm bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
        {t('successMessage')}
      </div>
    )
  }

  const inputClass = 'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-text-primary placeholder:text-neutral-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-white/10 dark:bg-neutral-800 dark:placeholder:text-neutral-500'

  return (
    <div>
      {(resolvedTitle || resolvedDescription) && (
        <div className="mb-3">
          {resolvedTitle && (
            <p className="text-sm font-semibold text-text-primary">
              {resolvedTitle}
            </p>
          )}
          {resolvedDescription && (
            <p className="text-sm mt-0.5 text-text-tertiary">
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
          className={`${inputClass} sm:max-w-[140px]`}
        />
        <label htmlFor="newsletter-email" className="sr-only">{t('emailPlaceholder')}</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          required
          className={inputClass}
        />
        <Button
          type="submit"
          disabled={status === 'loading'}
          variant="primary"
          size="sm"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </Button>
      </form>

      {status === 'error' && (
        <p className="mt-2 text-sm text-error-600 dark:text-error-400">
          {errorMsg}
        </p>
      )}
    </div>
  )
}
