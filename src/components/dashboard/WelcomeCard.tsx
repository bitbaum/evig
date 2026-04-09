'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Store, Wrench, BookOpen, User, X } from 'lucide-react'
import Heading from '@/components/ui/Heading'

const DISMISSED_KEY = 'revampit_onboarding_dismissed'

/**
 * WelcomeCard — Shown to new users who haven't dismissed it yet.
 * Uses localStorage to track dismissal (simplest approach, no API needed).
 */
export function WelcomeCard() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    if (!dismissed) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 sm:p-8 mb-6 relative">
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
        aria-label="Willkommensnachricht schliessen"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      <Heading level={2} className="text-xl font-bold text-gray-900 mb-2">
        Willkommen bei RevampIT!
      </Heading>
      <p className="text-base text-gray-600 mb-6">
        Was möchten Sie tun?
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/marketplace/sell"
          className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0" aria-hidden="true">
            <Store className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">Etwas verkaufen</div>
          </div>
        </Link>

        <Link
          href="/it-hilfe/create"
          className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 flex-shrink-0" aria-hidden="true">
            <Wrench className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">Hilfe bekommen</div>
          </div>
        </Link>

        <Link
          href="/workshops"
          className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0" aria-hidden="true">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Workshop besuchen</div>
          </div>
        </Link>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        Sie können auch{' '}
        <Link href="/dashboard/profile" className="font-semibold text-green-600 hover:text-green-700">
          Ihr Profil vervollständigen
        </Link>
        {' '}
        <User className="inline h-3.5 w-3.5 text-green-600" aria-hidden="true" />
      </p>
    </div>
  )
}
