'use client'

import { useState } from 'react'
// Locale-aware router from next-intl wrapper, NOT next/navigation directly —
// localePrefix is 'as-needed', so a non-DE user on /en/it-hilfe/accept who
// gets pushed to a plain /it-hilfe/<id> path would jump locale (en → de).
// Using this useRouter preserves the active locale across the redirect.
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface AcceptButtonProps {
  token: string
}

/**
 * Client island: the one button on the confirmation page that actually
 * mutates state. Kept narrow on purpose — the rest of the page is a
 * server component because token verification + offer display happens
 * server-side.
 *
 * POSTs the token to /api/it-hilfe/accept-offer-via-token. On success,
 * navigates to the request page with ?accepted=1 so the request page
 * can show a confirmation banner.
 */
export function AcceptButton({ token }: AcceptButtonProps) {
  const router = useRouter()
  const t = useTranslations('itHelp.accept')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function humanError(reason: string | undefined, fallback: string | undefined): string {
    switch (reason) {
      case 'expired':
        return t('errors.expired')
      case 'malformed':
      case 'invalid_signature':
        return t('errors.invalid')
      case 'offer_not_pending':
        return t('errors.offerNotPending')
      case 'request_not_open':
        return t('errors.requestNotOpen')
      case 'request_not_found':
        return t('errors.requestNotFound')
      case 'offer_not_found':
        return t('errors.offerNotFound')
      default:
        return fallback || t('errors.generic')
    }
  }

  async function handleAccept() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/it-hilfe/accept-offer-via-token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = (await res.json().catch(() => null)) as
        | { success: true; data: { requestId: string; helperId: string } }
        | { success: false; error?: string; reason?: string }
        | null

      if (!res.ok || !body || body.success === false) {
        // Distinct messages so the user can recover when possible.
        const reason = body && 'reason' in body ? body.reason : undefined
        const fallback = body?.success === false ? body.error : undefined
        setError(humanError(reason, fallback))
        setSubmitting(false)
        return
      }

      // Hard nav so the request page's server data is fresh.
      router.push(`/it-hilfe/${body.data.requestId}?accepted=1`)
      router.refresh()
    } catch {
      setError(t('errors.network'))
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleAccept}
        disabled={submitting}
        variant="primary"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('button.accepting')}
          </>
        ) : (
          t('button.accept')
        )}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-error-700 dark:text-error-400">
          {error}
        </p>
      )}
    </div>
  )
}
