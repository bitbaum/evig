import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Heading from '@/components/ui/Heading'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import { IT_HILFE, formatBudget } from '@/config/it-hilfe'
import {
  getTechnicianProfile,
  getActiveOfferCount,
  getMatchingRequests,
  getMyOffers,
} from '@/lib/dashboard/techniker'
import { UrgencyBadge, OfferStatusBadge } from '@/components/dashboard/TechnikerBadges'
import { getTranslations, getLocale } from 'next-intl/server'
import { ORG } from '@/config/org'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getTranslations({ locale, namespace: 'dashboard.meta' })
  return {
    title: `${t('technikerTitle')} | ${ORG.name}`,
    description: t('technikerDesc'),
  }
}

export default async function TechnikerDashboardPage() {
  const t = await getTranslations('dashboard.techniker')
  const session = await auth()
  const requestStatusLabels: Record<string, string> = {
    open: t('statusOpen'),
    matched: t('statusMatched'),
    completed: t('statusCompleted'),
    cancelled: t('statusCancelled'),
  }

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/dashboard/techniker')
  }

  const userId = session.user.id!

  const [profile, activeOfferCount, matchingRequests, myOffers] = await Promise.all([
    getTechnicianProfile(userId),
    getActiveOfferCount(userId),
    getMatchingRequests(userId),
    getMyOffers(userId),
  ])

  if (!profile) {
    return (
      <main className="min-h-screen bg-surface-raised">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💻</span>
          </div>
          <Heading level={1} className={cn('text-2xl font-bold mb-3', getTextColor('neutral', 'primary'), 'dark:text-white')}>
            {t('noProfile')}
          </Heading>
          <p className={cn('text-base mb-8', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
            {t('noProfileDesc')}
          </p>
          <Link
            href={IT_HILFE.routes.register}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
          >
            {t('createProfile')}
          </Link>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className={cn('text-sm', getTextColor('neutral', 'muted'), 'hover:underline dark:text-text-muted')}
            >
              {t('backToDashboard')}
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const ratingDisplay = parseFloat(profile.averageRating) > 0
    ? parseFloat(profile.averageRating).toFixed(1)
    : '–'

  return (
    <main className="min-h-screen bg-surface-raised">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 border-b border-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
              {t('pageSubtitle')}
              {profile.city ? ` · ${profile.city}` : ''}
              {!profile.isActive && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
                  {t('profileInactive')}
                </span>
              )}
            </p>
            <Heading level={1} className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
              {t('pageTitle')}
            </Heading>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={IT_HILFE.routes.register}
              className="px-4 py-2 text-sm border border-default text-text-secondary rounded-lg hover:bg-surface-raised transition-colors"
            >
              {t('editProfile')}
            </Link>
            <Link
              href={IT_HILFE.routes.browse}
              className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              {t('allRequests')}
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-base rounded-lg border p-5">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
              {t('statsCompleted')}
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {profile.totalJobsCompleted}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-text-tertiary')}>
              {t('statsCompletedSub')}
            </p>
          </div>

          <div className="bg-surface-base rounded-lg border p-5">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
              {t('statsRating')}
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {ratingDisplay}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-text-tertiary')}>
              {t('statsRatingSub')}
            </p>
          </div>

          <div className="bg-surface-base rounded-lg border p-5 col-span-2 md:col-span-1">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
              {t('statsActiveOffers')}
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {activeOfferCount}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-text-tertiary')}>
              {t('statsActiveOffersSub')}
            </p>
          </div>
        </div>

        {/* Main content: two sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Section 1: Passende Anfragen */}
          <div className="bg-surface-base rounded-lg border">
            <div className="p-5 border-b border-subtle flex items-center justify-between">
              <div>
                <Heading level={2} className={cn('text-base font-semibold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                  {t('matchingTitle')}
                </Heading>
                <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                  {t('matchingSubtitle')}
                </p>
              </div>
              <Link
                href={IT_HILFE.routes.browse}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium"
              >
                {t('viewAll')}
              </Link>
            </div>

            <div className="p-5">
              {matchingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-3">🔍</span>
                  <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                    {t('noMatching')}
                  </p>
                  <Link
                    href={IT_HILFE.routes.register}
                    className="text-sm text-cyan-600 hover:underline mt-2 inline-block"
                  >
                    {t('addSkills')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingRequests.map(req => (
                    <Link
                      key={req.id}
                      href={IT_HILFE.routes.detail(req.id)}
                      className="block p-3 rounded-lg border border-subtle hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium line-clamp-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                          {req.title}
                        </p>
                        <UrgencyBadge urgency={req.urgency} />
                      </div>
                      <p className={cn('text-xs mt-1', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                        {req.city}, {req.canton}
                        {' · '}
                        {formatBudget(req.budgetAmountCents, req.budgetTier ?? undefined)}
                        {req.offerCount > 0 && ` · ${t('offerCount', { count: req.offerCount })}`}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Meine Angebote */}
          <div className="bg-surface-base rounded-lg border">
            <div className="p-5 border-b border-subtle flex items-center justify-between">
              <div>
                <Heading level={2} className={cn('text-base font-semibold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                  {t('myOffersTitle')}
                </Heading>
                <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                  {t('myOffersSubtitle')}
                </p>
              </div>
            </div>

            <div className="p-5">
              {myOffers.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-3">📋</span>
                  <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                    {t('noOffers')}
                  </p>
                  <Link
                    href={IT_HILFE.routes.browse}
                    className="text-sm text-cyan-600 hover:underline mt-2 inline-block"
                  >
                    {t('browseRequests')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOffers.map(offer => (
                    <Link
                      key={offer.offerId}
                      href={IT_HILFE.routes.detail(offer.requestId)}
                      className="block p-3 rounded-lg border border-subtle hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium line-clamp-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                          {offer.requestTitle}
                        </p>
                        <OfferStatusBadge status={offer.offerStatus} />
                      </div>
                      <p className={cn('text-xs mt-1', getTextColor('neutral', 'muted'), 'dark:text-text-muted')}>
                        {offer.city}, {offer.canton}
                        {' · '}
                        {t('requestStatus', { status: requestStatusLabels[offer.requestStatus] ?? offer.requestStatus })}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick links footer */}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={IT_HILFE.routes.register}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-surface-base border',
              getTextColor('neutral', 'primary'), 'dark:text-white',
              'hover:bg-surface-raised transition-colors'
            )}
          >
            ✏️ {t('editProfile')}
          </Link>
          <Link
            href={IT_HILFE.routes.browse}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-surface-base border',
              getTextColor('neutral', 'primary'), 'dark:text-white',
              'hover:bg-surface-raised transition-colors'
            )}
          >
            🔍 {t('allRequests')}
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-surface-base border',
              getTextColor('neutral', 'muted'), 'dark:text-text-muted',
              'hover:bg-surface-raised transition-colors'
            )}
          >
            ← {t('backToDashboard')}
          </Link>
        </div>

      </div>
    </main>
  )
}
