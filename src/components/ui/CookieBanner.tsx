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
      className="fixed inset-x-0 bottom-0 z-9998 border-t-2 border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {t('description')}
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/datenschutz"
            className="text-center text-sm font-medium text-primary-700 underline hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
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
