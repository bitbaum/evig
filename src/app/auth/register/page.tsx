'use client'

import { RegistrationWizard } from '@/components/auth/RegistrationWizard'
import Link from 'next/link'
import { useEffect } from 'react'
import { ORG } from '@/config/org'

// Client-side only page to avoid server-side session checks blocking the page
export default function RegisterPage() {
  // Set page title on client side
  useEffect(() => {
    document.title = `Registrieren | ${ORG.name}`
  }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-green-600 hover:text-green-700 dark:text-green-400 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Startseite
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                Revamp<span className="text-green-600">IT</span>
              </span>
            </div>
          </Link>
        </div>

        {/* Registration Wizard */}
        <RegistrationWizard />
      </div>
    </main>
  )
}








