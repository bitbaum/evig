import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import { ROLES, type UserRole } from '@/lib/constants'
import { isSuperAdmin } from '@/lib/permissions'
import { getAllDashboardCards } from '@/config/dashboard'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.meta')
  return {
    title: t('dashboardTitle'),
    description: t('dashboardDesc'),
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const t = await getTranslations('dashboard.home')

  const cards = getAllDashboardCards({
    role: session.user.role,
    isStaff: session.user.isStaff,
    isSuperAdmin: isSuperAdmin(session.user.email || ''),
  })

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session.user.emailVerified && session.user.email && (
          <EmailVerificationBanner email={session.user.email} className="mb-6" />
        )}

        <OnboardingChecklist
          role={(session.user.role as UserRole) || ROLES.CUSTOMER}
          emailVerified={session.user.emailVerified ?? false}
          className="mb-6"
        />

        <div className="mb-8">
          <h1 className={cn('text-3xl font-bold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
            {t('welcomeBack', { name: session.user.name || session.user.email || t('unknownUser') })}
          </h1>
          <p className={cn('mt-2 text-sm sm:text-base', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {cards.map(card => (
            <DashboardCard key={card.id} card={card} />
          ))}
        </div>
      </div>
    </main>
  )
}
