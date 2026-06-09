'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { CheckCircle2 } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

/**
 * Auth-aware "follow the project" CTA for the Monitor-Upcycling mini-site.
 *
 * Two states keyed on session:
 *   - Authenticated  → one button. We already know their email, so it's
 *                      a single click to subscribe with source='upcycling-interest'.
 *                      A small caption echoes which address we'll use so
 *                      they aren't surprised.
 *   - Anonymous      → standard email input + submit. Same endpoint.
 *
 * Posts to /api/newsletter/subscribe (existing endpoint). source field
 * keeps the funnel attributable in analytics. No new persistence layer,
 * no new schema — KISS, DRY.
 */
export function UpcyclingInterestCTA({ className = '' }: { className?: string }) {
  // TS type cache flakes on the deep nested namespace; pull from `projects`
  // root and prefix every key. Same workaround used elsewhere in this repo.
  const tRoot = useTranslations('projects')
  const t = (
    key: string,
    args?: Record<string, string | number>,
  ): string => tRoot(`upcycling.interestCta.${key}` as never, args as never)
  const { data: session, status: sessionStatus } = useSession()
  const sessionEmail = session?.user?.email ?? null
  const sessionName = session?.user?.name ?? null
  const isLoggedIn = sessionStatus === 'authenticated' && !!sessionEmail

  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function subscribe(useEmail: string, useName?: string | null) {
    setState('loading')
    setErrorMsg('')
    const { error } = await apiFetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: useEmail, name: useName ?? undefined, source: 'upcycling-interest' },
    })
    if (error) {
      setErrorMsg(error)
      setState('error')
    } else {
      setState('success')
    }
  }

  if (state === 'success') {
    return (
      <div className={`flex items-start gap-3 rounded-lg border border-subtle bg-action-muted/10 p-5 ${className}`}>
        <CheckCircle2 className="h-5 w-5 text-action shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-text-primary">{t('successTitle')}</p>
          <p className="text-sm text-text-secondary mt-1">{t('successBody')}</p>
        </div>
      </div>
    )
  }

  // While next-auth resolves the session we don't yet know which UI to
  // render. Show a low-fidelity placeholder of the email-input form so
  // the layout doesn't shift when the session lands.
  if (sessionStatus === 'loading') {
    return (
      <div
        aria-hidden="true"
        className={`flex flex-col sm:flex-row gap-2 opacity-50 ${className}`}
      >
        <Input type="email" disabled placeholder=" " className="sm:flex-1" />
        <Button type="button" variant="primary" disabled>{t('submitButton')}</Button>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className={className}>
        <Button
          variant="primary"
          disabled={state === 'loading'}
          onClick={() => subscribe(sessionEmail!, sessionName)}
        >
          {state === 'loading' ? t('subscribing') : t('oneClickButton')}
        </Button>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-text-tertiary">
          {t('oneClickHint', { email: sessionEmail! })}
        </p>
        {errorMsg && <p className="mt-2 text-sm text-error-700 dark:text-error-400">{errorMsg}</p>}
      </div>
    )
  }

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault()
        if (email) subscribe(email, null)
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          required
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sm:flex-1"
          aria-label={t('emailPlaceholder')}
        />
        <Button type="submit" variant="primary" disabled={state === 'loading'}>
          {state === 'loading' ? t('subscribing') : t('submitButton')}
        </Button>
      </div>
      {errorMsg && <p className="mt-2 text-sm text-error-700 dark:text-error-400">{errorMsg}</p>}
    </form>
  )
}
