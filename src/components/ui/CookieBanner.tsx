'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const accepted = localStorage.getItem(CONSENT_KEY) === CONSENT_VALUE
      if (!accepted) setVisible(true)
    } catch {
      // localStorage unavailable (private mode, SSR edge) — show banner
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
      aria-label="Cookie-Hinweis"
      className="fixed inset-x-0 bottom-0 z-[9998] border-t-2 border-neutral-200 bg-white shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">
          Wir verwenden nur essenzielle Cookies für Sitzungen und Sicherheit.
          Keine Tracking-Cookies.
        </p>
        <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/datenschutz"
            className="text-center text-sm font-medium text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            Mehr erfahren
          </Link>
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  )
}
