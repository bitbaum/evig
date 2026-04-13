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
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { isStaffEmail } from '@/lib/permissions'
import Heading from '@/components/ui/Heading'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { formatDate } from '@/lib/date-formats'

export const metadata: Metadata = {
  title: 'Dashboard | RevampIT',
  description: 'Verwalte dein RevampIT-Konto, Workshops, Bestellungen und mehr.',
}

interface MemberStatus {
  isMember: boolean
  memberSince: string | null
  memberType: string | null
}

async function getMemberStatus(userId: string): Promise<MemberStatus> {
  try {
    const result = await query<{
      is_member: boolean
      member_since: string | null
      member_type: string | null
    }>(
      `SELECT is_member, member_since, member_type
       FROM ${TABLE_NAMES.USERS}
       WHERE id = $1`,
      [userId]
    )
    const row = result.rows[0]
    return {
      isMember: row?.is_member ?? false,
      memberSince: row?.member_since ?? null,
      memberType: row?.member_type ?? null,
    }
  } catch {
    return { isMember: false, memberSince: null, memberType: null }
  }
}

const MEMBER_TYPE_LABELS: Record<string, string> = {
  regular: 'Ordentliches Mitglied',
  reduced: 'Ermässigtes Mitglied',
  honorary: 'Ehrenmitglied',
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const userRole = await getCurrentUserRole()
  const memberStatus = await getMemberStatus(session.user.id!)

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email Verification Banner */}
        {!session.user.emailVerified && session.user.email && (
          <EmailVerificationBanner email={session.user.email} className="mb-6" />
        )}

        {/* Welcome Card for new users */}
        <WelcomeCard />

        {/* Onboarding Checklist */}
        <OnboardingChecklist
          role={userRole || ROLES.CUSTOMER}
          emailVerified={session.user.emailVerified ?? false}
          className="mb-6"
        />

        <div className="mb-8">
          <Heading level={1} className={cn('text-3xl font-bold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
            Willkommen zurück, {session.user.name || session.user.email}!
          </Heading>
          <p className={cn('mt-2 text-sm sm:text-base', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
            Verwalte dein Konto und entdecke alle verfügbaren Funktionen.
          </p>
        </div>

        {/* Member Status Card */}
        {memberStatus.isMember ? (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-green-600 dark:text-green-400 text-xl">🏅</span>
              </div>
              <div>
                <Heading level={3} className={cn('text-base font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Du bist Mitglied
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-green-300')}>
                  {memberStatus.memberType ? MEMBER_TYPE_LABELS[memberStatus.memberType] ?? memberStatus.memberType : 'Mitglied'}
                  {memberStatus.memberSince ? ` · Dabei seit ${formatDate(memberStatus.memberSince)}` : ''}
                </p>
              </div>
            </div>
            <Link
              href="/decisions"
              className="shrink-0 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Abstimmungen
            </Link>
          </div>
        ) : (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-xl">🤝</span>
              </div>
              <div>
                <Heading level={3} className={cn('text-base font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Werde Mitglied
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-blue-300')}>
                  Unterstütze unsere Mission und nimm an Abstimmungen teil
                </p>
              </div>
            </div>
            <Link
              href="/mitglied-werden"
              className="shrink-0 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mitglied werden
            </Link>
          </div>
        )}

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
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Mein Profil
                </Heading>
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
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Meine Workshops
                </Heading>
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
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Termine
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Service-Termin buchen
                </p>
              </div>
            </div>
          </Link>

          {/* Seller card — role dashboard if seller, upsell otherwise */}
          <Link
            href="/dashboard/seller"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900 rounded-lg flex items-center justify-center">
                <span className="text-secondary-600 dark:text-secondary-400 text-xl">🏪</span>
              </div>
              <div className="ml-4">
                <Heading level={3} className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  {userRole === ROLES.SELLER ? 'Seller Dashboard' : 'Auf Revamp‑IT verkaufen'}
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  {userRole === ROLES.SELLER ? 'Produkte und Verkäufe' : 'Eigene Produkte anbieten – Versand direkt an Käufer'}
                </p>
              </div>
            </div>
          </Link>

          {/* Techniker card — role dashboard if repairer, upsell otherwise */}
          <Link
            href="/dashboard/techniker"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900 rounded-lg flex items-center justify-center">
                <span className="text-warning-600 dark:text-warning-400 text-xl">🔧</span>
              </div>
              <div className="ml-4">
                <Heading level={3} className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                  {userRole === ROLES.REPAIRER ? 'Techniker Dashboard' : 'Reparaturen anbieten'}
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  {userRole === ROLES.REPAIRER ? 'Anfragen und Angebote verwalten' : 'Dienstleistungen publizieren und Anfragen erhalten'}
                </p>
              </div>
            </div>
          </Link>

          {/* Show admin card for staff users */}
          {(session.user.isStaff || isStaffEmail(session.user.email || '')) && (
            <Link
              href="/admin"
              className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error-100 dark:bg-error-900 rounded-lg flex items-center justify-center">
                  <span className="text-error-600 dark:text-error-400 text-xl">⚙️</span>
                </div>
                <div className="ml-4">
                  <Heading level={3} className={cn('text-lg font-semibold', getTextColor('white', 'primary'), 'dark:text-white')}>
                    Admin-Bereich
                  </Heading>
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
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Workshop vorschlagen
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Eigene Workshops anbieten
                </p>
              </div>
            </div>
          </Link>

          
          {/* My Blog Submissions Card */}
          <Link
            href="/dashboard/blog-submissions"
            className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border-2 border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 text-xl">📝</span>
              </div>
              <div className="ml-4">
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Meine Einreichungen
                </Heading>
                <p className={cn('text-sm', getTextColor('white', 'muted'), 'dark:text-neutral-400')}>
                  Status deiner Blog-Beiträge verfolgen
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
                <Heading level={3} className={cn('text-lg', getTextColor('white', 'primary'), 'dark:text-white')}>
                  Beitrag verfassen
                </Heading>
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