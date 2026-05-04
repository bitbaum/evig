'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

const CONSENT_KEY = 'cookie_consent'
const CONSENT_VALUE = 'accepted'

/**
 * Cookie consent banner (Swiss DSG compliant).
 *
 * RevampIT uses only essential cookies (session, CSRF) — no tracking cookies.
 * Under Swiss DSG, a simple acknowledgment is sufficient; no granular consent needed.
 *
 * Hidden until hydration completes to prevent flash of banner on accepted state.
 */
export function CookieBanner() {
  const t = useTranslations('cookies')

  // Start hidden (matches SSR output). After hydration, read localStorage to
  // decide whether to show — avoids SSR/client mismatch that breaks hydration.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(CONSENT_KEY) !== CONSENT_VALUE)
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, CONSENT_VALUE)
    } catch {
      // Ignore storage errors — user still gets UX of dismissal
    }
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('title')}
      className="fixed inset-x-0 bottom-0 z-[9998] border-t-2 border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          {t('description')}
        </p>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/datenschutz"
            className="text-center text-sm font-medium text-primary-700 underline hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
          >
            {t('learnMore')}
          </Link>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
