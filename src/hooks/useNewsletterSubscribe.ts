'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'

export type NewsletterStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Shared newsletter-subscribe state machine + submit. The two NewsletterSignup
 * components (blog hero band, community inline) render differently and use
 * different i18n namespaces, but the POST + idle/loading/success/error logic was
 * duplicated — this is the single source for it. Pass the localized network-error
 * string; the caller owns all other copy.
 */
export function useNewsletterSubscribe(networkErrorMessage: string) {
  const [status, setStatus] = useState<NewsletterStatus>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function subscribe(input: {
    email: string
    name?: string
    source?: string
  }): Promise<boolean> {
    if (!input.email) return false
    setStatus('loading')
    setErrorMsg('')
    try {
      const { error: apiError } = await apiFetch('/api/newsletter/subscribe', {
        method: 'POST',
        body: { email: input.email, name: input.name || undefined, source: input.source },
      })
      if (!apiError) {
        setStatus('success')
        return true
      }
      setErrorMsg(apiError)
      setStatus('error')
      return false
    } catch (err) {
      logger.warn('Newsletter signup failed', { error: err })
      setErrorMsg(networkErrorMessage)
      setStatus('error')
      return false
    }
  }

  return { status, errorMsg, subscribe }
}
