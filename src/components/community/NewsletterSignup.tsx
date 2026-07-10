'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useNewsletterSubscribe } from '@/hooks/useNewsletterSubscribe'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
  const { status, errorMsg, subscribe } = useNewsletterSubscribe(t('networkError'))

  const resolvedTitle = title ?? t('title')
  const resolvedDescription = description ?? t('subtitle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await subscribe({ email, name, source })
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg p-4 text-sm bg-action-muted text-action">
        {t('successMessage')}
      </div>
    )
  }

  const inputClass = 'h-10 border-default dark:border-white/10 dark:placeholder:text-text-tertiary'

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
        <Input
          id="newsletter-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          className={`${inputClass} sm:max-w-[140px]`}
        />
        <label htmlFor="newsletter-email" className="sr-only">{t('emailPlaceholder')}</label>
        <Input
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
