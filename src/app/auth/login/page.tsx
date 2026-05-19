'use client'

import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/ui/Logo'

function LoginFormFallback() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const t = useTranslations('auth.login')
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    document.title = t('pageTitle')
  }, [t])

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/admin')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6 lg:px-8">
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

        {/* Login Form with Suspense for useSearchParams */}
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  )
}
