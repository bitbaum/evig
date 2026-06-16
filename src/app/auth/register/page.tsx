'use client'

import { useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ORG } from '@/config/org'
import { Logo } from '@/components/ui/Logo'
import { RegistrationWizard } from '@/components/auth/RegistrationWizard'
import { AuthenticatedRedirect } from '@/components/auth/AuthenticatedRedirect'

export default function RegisterPage() {
  const t = useTranslations('auth.login')
  const { status } = useSession()

  useEffect(() => {
    document.title = `Registrieren | ${ORG.name}`
  }, [])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-raised">
        <Suspense fallback={null}>
          <AuthenticatedRedirect />
        </Suspense>
        <Loader2 className="w-8 h-8 animate-spin text-action" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-raised py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <AuthenticatedRedirect />
      </Suspense>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-action hover:text-action transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t('backHome')}
          </Link>
        </div>
        <div className="flex justify-center mb-8">
          <Logo showText={true} />
        </div>
        <RegistrationWizard />
      </div>
    </div>
  )
}
