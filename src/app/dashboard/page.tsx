import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ROLES } from '@/lib/constants'
import { getCurrentUserRole } from '@/middleware/admin'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { hasAdminAccessUnified, type UnifiedUser } from '@/lib/auth/unified-permissions'

export const metadata: Metadata = {
  title: 'Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-Konto, Workshops, Bestellungen und mehr.',
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const userRole = await getCurrentUserRole()

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Verification Banner */}
        {!session.user.emailVerified && session.user.email && (
          <EmailVerificationBanner email={session.user.email} className="mb-6" />
        )}

        {/* Onboarding Checklist */}
        <OnboardingChecklist
          role={userRole || ROLES.CUSTOMER}
          emailVerified={session.user.emailVerified ?? false}
          className="mb-6"
        />

        <div className="mb-8">
          <h1 className={cn('text-3xl font-bold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
            Willkommen zurück, {session.user.name || session.user.email}!
          </h1>
          <p className={cn('mt-2 text-sm sm:text-base', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
            Verwalten Sie Ihr Konto und entdecken Sie alle verfügbaren Funktionen.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Profile Card */}
          <Link
            href="/dashboard/profile"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-info-100 dark:bg-info-900 rounded-lg flex items-center justify-center">
                <span className="text-info-600 dark:text-info-400 font-semibold text-lg">
                  {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="ml-4">
                <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Mein Profil
                </h3>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Persönliche Daten verwalten
                </p>
              </div>
            </div>
          </Link>

          {/* Workshops Card */}
          <Link
            href="/dashboard/workshops"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">🎓</span>
              </div>
              <div className="ml-4">
                <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Meine Workshops
                </h3>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Angemeldete Kurse verwalten
                </p>
              </div>
            </div>
          </Link>

          {/* Appointments Card */}
          <Link
            href="/dashboard/appointments"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 dark:text-orange-400 text-xl">📅</span>
              </div>
              <div className="ml-4">
                <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Termine
                </h3>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Service-Termin buchen
                </p>
              </div>
            </div>
          </Link>

          {/* Role-specific cards */}
          {userRole === ROLES.SELLER && (
            <Link
              href="/dashboard/seller"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center">
                  <span className="text-secondary-600 dark:text-secondary-400 text-xl">🏪</span>
                </div>
                <div className="ml-4">
                  <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Seller Dashboard
                  </h3>
                  <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                    Produkte und Verkäufe
                  </p>
                </div>
              </div>
            </Link>
          )}

          {userRole === ROLES.REPAIRER && (
            <Link
              href="/dashboard/repairer"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
                  <span className="text-warning-600 dark:text-warning-400 text-xl">🔧</span>
                </div>
                <div className="ml-4">
                  <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Repairer Dashboard
                  </h3>
                  <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                    Reparaturen verwalten
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Upsell cards for capabilities (visible if user doesn't have role yet) */}
          {userRole !== ROLES.SELLER && (
            <Link
              href="/dashboard/seller"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center">
                  <span className="text-secondary-600 dark:text-secondary-400 text-xl">🏪</span>
                </div>
                <div className="ml-4">
                  <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Auf Revamp‑IT verkaufen
                  </h3>
                  <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                    Eigene Produkte anbieten – Versand direkt an Käufer
                  </p>
                </div>
              </div>
            </Link>
          )}

          {userRole !== ROLES.REPAIRER && (
            <Link
              href="/dashboard/repairer"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
                  <span className="text-warning-600 dark:text-warning-400 text-xl">🔧</span>
                </div>
                <div className="ml-4">
                  <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Reparaturen anbieten
                  </h3>
                  <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                    Dienstleistungen publizieren und Anfragen erhalten
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* UNIFIED: Show admin card for users with admin access via old role OR new is_staff system */}
          {hasAdminAccessUnified({
            email: session.user.email || '',
            role: userRole || undefined,
            isStaff: session.user.isStaff,
            staffPermissions: session.user.staffPermissions,
            isSuperAdmin: session.user.isSuperAdmin,
          } as UnifiedUser) && (
            <Link
              href="/admin"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-lg flex items-center justify-center">
                  <span className="text-error-600 dark:text-error-400 text-xl">⚙️</span>
                </div>
                <div className="ml-4">
                  <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Admin-Bereich
                  </h3>
                  <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                    System verwalten
                  </p>
                </div>
              </div>
            </Link>
          )}

          {/* Workshop Proposal Card */}
          <Link
            href="/workshops/propose"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">🎓</span>
              </div>
              <div className="ml-4">
                <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Workshop vorschlagen
                </h3>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Eigene Workshops anbieten
                </p>
              </div>
            </div>
          </Link>

          
          {/* Blog Submit Card */}
          <Link
            href="/blog/submit"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-info-100 dark:bg-info-900 rounded-lg flex items-center justify-center">
                <span className="text-info-600 dark:text-info-400 text-xl">✍️</span>
              </div>
              <div className="ml-4">
                <h3 className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Beitrag verfassen
                </h3>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Idee teilen oder Tutorial schreiben
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}