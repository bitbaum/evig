'use client'

import { useSyncExternalStore, useCallback } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

const CONSENT_KEY = 'cookie_consent'
const CONSENT_VALUE = 'accepted'

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

function getSnapshot() {
  try {
    return localStorage.getItem(CONSENT_KEY) !== CONSENT_VALUE
  } catch {
    return true
  }
}

// SSR snapshot: hide banner until hydration to avoid flash
function getServerSnapshot() {
  return false
}

/**
 * Cookie consent banner (Swiss DSG compliant).
 *
 * RevampIT uses only essential cookies (session, CSRF) — no tracking cookies.
 * Under Swiss DSG, a simple acknowledgment is sufficient; no granular consent needed.
 */
export function CookieBanner() {
  const t = useTranslations('cookies')
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const handleAccept = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, CONSENT_VALUE)
      // Dispatch storage event so useSyncExternalStore re-evaluates getSnapshot
      window.dispatchEvent(new StorageEvent('storage'))
    } catch {
      // Ignore storage errors — banner will disappear on next page load
    }
  }, [])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-9998 border-t-2 border-subtle bg-surface-base"
    >
      <div className="mx-auto grid max-w-6xl gap-2 px-3 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
        <p className="text-xs leading-relaxed text-text-secondary sm:text-sm">
          {t('description')}
        </p>
        <div className="flex shrink-0 items-center justify-end gap-3">
          <Link
            href="/datenschutz"
            className="text-center text-sm font-medium text-action underline hover:text-action-hover"
          >
            {t('learnMore')}
          </Link>
          <Button
            type="button"
            onClick={handleAccept}
            variant="primary"
            size="sm"
          >
            {t('accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
