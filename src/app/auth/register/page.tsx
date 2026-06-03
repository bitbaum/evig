'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ORG } from '@/config/org'
import { Logo } from '@/components/ui/Logo'
import { RegistrationWizard } from '@/components/auth/RegistrationWizard'

export default function RegisterPage() {
  const t = useTranslations('auth.login')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    document.title = `Registrieren | ${ORG.name}`
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
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
