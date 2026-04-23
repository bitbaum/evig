import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import {
  getAllDashboardCards,
  groupCardsByCategory,
  DASHBOARD_CATEGORIES,
} from '@/config/dashboard'
import Heading from '@/components/ui/Heading'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { formatDate } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Dashboard | RevampIT',
  description: 'Verwalte dein RevampIT-Konto, Workshops, Bestellungen und mehr.',
}

interface MemberStatus {
  isMember: boolean
  memberSince: string | null
  memberType: string | null
}

interface ActivityCounts {
  activeAppointments: number
  pendingQuotes: number
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
  } catch (error) {
    logger.error('Failed to fetch member status', { userId, error })
    return { isMember: false, memberSince: null, memberType: null }
  }
}

async function getActivityCounts(userId: string): Promise<ActivityCounts> {
  try {
    const result = await query<{
      active_appointments: string
      pending_quotes: string
    }>(
      `SELECT
        COUNT(CASE WHEN status NOT IN ('completed', 'cancelled', 'rejected') THEN 1 END) AS active_appointments,
        COUNT(CASE WHEN status = 'quoted' THEN 1 END) AS pending_quotes
       FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS}
       WHERE user_id = $1`,
      [userId]
    )
    return {
      activeAppointments: parseInt(result.rows[0]?.active_appointments ?? '0', 10),
      pendingQuotes: parseInt(result.rows[0]?.pending_quotes ?? '0', 10),
    }
  } catch (error) {
    logger.error('Failed to fetch activity counts', { userId, error })
    return { activeAppointments: 0, pendingQuotes: 0 }
  }
}

export default async function DashboardPage() {
  const t = await getTranslations('dashboard.home')
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard')
  }

  const [memberStatus, counts] = await Promise.all([
    getMemberStatus(session.user.id!),
    getActivityCounts(session.user.id!),
  ])

  const allCards = getAllDashboardCards({
    role: session.user.role ?? null,
    isStaff: session.user.isStaff,
    isSuperAdmin: false,
  })

  // Inject live count badges on relevant cards
  const cardsWithBadges = allCards.map(card => {
    if (card.id === 'appointments' && counts.activeAppointments > 0)
      return { ...card, badge: t('activeBadge', { count: counts.activeAppointments }) }
    if (card.id === 'bookings' && counts.activeAppointments > 0)
      return { ...card, badge: t('activeBadge', { count: counts.activeAppointments }) }
    return card
  })

  const grouped = groupCardsByCategory(cardsWithBadges)

  const userName = session.user.name || session.user.email || t('unknownUser')

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Email Verification Banner */}
        {!session.user.emailVerified && session.user.email && (
          <EmailVerificationBanner email={session.user.email} className="mb-6" />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <Heading
              level={1}
              className={cn('text-2xl sm:text-3xl font-bold', getTextColor('neutral', 'primary'), 'dark:text-white')}
            >
              {t('welcomeBack', { name: userName })}
            </Heading>
            <p className={cn('mt-1 text-sm sm:text-base', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
              {t('subtitle')}
            </p>
          </div>

          {/* Member status — inline badge, not full banner */}
          {memberStatus.isMember ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium shrink-0">
              <span>🏅</span>
              <span>
                {memberStatus.memberType === 'regular' ? t('memberTypeRegular')
                  : memberStatus.memberType === 'reduced' ? t('memberTypeReduced')
                  : memberStatus.memberType === 'honorary' ? t('memberTypeHonorary')
                  : t('memberFallback')}
                {memberStatus.memberSince && (
                  <span className="font-normal opacity-75"> · {t('memberSince', { date: formatDate(memberStatus.memberSince) })}</span>
                )}
              </span>
            </div>
          ) : (
            <Link
              href="/mitglied-werden"
              className="shrink-0 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              {t('becomeMember')}
            </Link>
          )}
        </div>

        {/* Pending quotes alert */}
        {counts.pendingQuotes > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center gap-3 text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{t('pendingQuotes', { count: counts.pendingQuotes })}</span>
            <Link
              href="/dashboard/bookings"
              className="ml-auto text-sm font-medium text-amber-900 dark:text-amber-200 hover:underline shrink-0"
            >
              {t('viewAlerts')}
            </Link>
          </div>
        )}

        {/* Grouped card sections */}
        {Array.from(grouped.entries()).map(([category, cards]) => {
          if (cards.length === 0) return null
          const categoryConfig = DASHBOARD_CATEGORIES[category]
          return (
            <section key={category} className="mb-8">
              <h2 className={cn(
                'text-xs font-semibold uppercase tracking-wider mb-3',
                getTextColor('neutral', 'muted'),
                'dark:text-neutral-500'
              )}>
                {categoryConfig.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map(card => (
                  <DashboardCard key={card.id} card={card} />
                ))}
              </div>
            </section>
          )
        })}

      </div>
    </main>
  )
}
