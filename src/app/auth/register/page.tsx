'use client'

import { RegistrationWizard } from '@/components/auth/RegistrationWizard'
import Link from 'next/link'
import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ORG } from '@/config/org'
import { Logo } from '@/components/ui/Logo'

// Client-side only page to avoid server-side session checks blocking the page
export default function RegisterPage() {
  const t = useTranslations('auth.login')

  // Set page title on client side
  useEffect(() => {
    document.title = `Registrieren | ${ORG.name}`
  }, [])
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('backHome')}
          </Link>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo showText={true} />
        </div>

        {/* Registration Wizard */}
        <RegistrationWizard />
      </div>
    </main>
  )
}








