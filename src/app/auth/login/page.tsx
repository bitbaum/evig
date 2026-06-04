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
      <div className="bg-surface-base rounded-2xl border border-strong p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-action" />
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
      <main className="min-h-screen flex items-center justify-center bg-surface-raised">
        <Loader2 className="w-8 h-8 animate-spin text-action" />
      </main>
    )
  }
  return (
    <main className="min-h-screen bg-surface-raised py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-action hover:text-action transition-colors"
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
