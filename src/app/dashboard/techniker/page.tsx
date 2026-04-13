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

export const metadata: Metadata = {
  title: 'Techniker Dashboard | RevampIT',
  description: 'Verwalte deine IT-Hilfe Anfragen und Angebote.',
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  in_discussion: 'In Gespräch',
  matched: 'Vergeben',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen',
}

export default async function TechnikerDashboardPage() {
  const session = await auth()

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
      <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 bg-cyan-100 dark:bg-cyan-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💻</span>
          </div>
          <Heading level={1} className={cn('text-2xl font-bold mb-3', getTextColor('neutral', 'primary'), 'dark:text-white')}>
            Kein Techniker-Profil gefunden
          </Heading>
          <p className={cn('text-base mb-8', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
            Erstelle zuerst ein Techniker-Profil, um IT-Hilfe Anfragen zu sehen und Angebote zu machen.
          </p>
          <Link
            href={IT_HILFE.routes.register}
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors"
          >
            Profil erstellen
          </Link>
          <div className="mt-4">
            <Link
              href="/dashboard"
              className={cn('text-sm', getTextColor('neutral', 'muted'), 'hover:underline dark:text-neutral-400')}
            >
              Zurück zum Dashboard
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
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Heading level={1} className={cn('text-2xl font-bold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              Techniker Dashboard
            </Heading>
            <p className={cn('mt-1 text-sm', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
              Übersicht deiner IT-Hilfe Aktivitäten
              {profile.city ? ` · ${profile.city}` : ''}
              {!profile.isActive && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  Profil inaktiv
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={IT_HILFE.routes.register}
              className="px-4 py-2 text-sm border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Profil bearbeiten
            </Link>
            <Link
              href={IT_HILFE.routes.browse}
              className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
            >
              Alle Anfragen
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
              Abgeschlossen
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {profile.totalJobsCompleted}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-neutral-500')}>
              Hilfen gesamt
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
              Bewertung
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {ratingDisplay}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-neutral-500')}>
              Ø Sterne
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5 col-span-2 md:col-span-1">
            <p className={cn('text-xs font-medium uppercase tracking-wide', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
              Aktive Angebote
            </p>
            <p className={cn('text-3xl font-bold mt-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
              {activeOfferCount}
            </p>
            <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-neutral-500')}>
              Ausstehend
            </p>
          </div>
        </div>

        {/* Main content: two sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Section 1: Passende Anfragen */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <Heading level={2} className={cn('text-base font-semibold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                  Passende Anfragen
                </Heading>
                <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                  Offene Anfragen, die deinen Skills entsprechen
                </p>
              </div>
              <Link
                href={IT_HILFE.routes.browse}
                className="text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 font-medium"
              >
                Alle ansehen →
              </Link>
            </div>

            <div className="p-5">
              {matchingRequests.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-3">🔍</span>
                  <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                    Keine passenden Anfragen gefunden.
                  </p>
                  <Link
                    href={IT_HILFE.routes.register}
                    className="text-sm text-cyan-600 hover:underline mt-2 inline-block"
                  >
                    Skills im Profil ergänzen
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchingRequests.map(req => (
                    <Link
                      key={req.id}
                      href={IT_HILFE.routes.detail(req.id)}
                      className="block p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium line-clamp-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                          {req.title}
                        </p>
                        <UrgencyBadge urgency={req.urgency} />
                      </div>
                      <p className={cn('text-xs mt-1', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                        {req.city}, {req.canton}
                        {' · '}
                        {formatBudget(req.budgetAmountCents, req.budgetTier ?? undefined)}
                        {req.offerCount > 0 && ` · ${req.offerCount} Angebot${req.offerCount === 1 ? '' : 'e'}`}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Meine Angebote */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
              <div>
                <Heading level={2} className={cn('text-base font-semibold', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                  Meine Angebote
                </Heading>
                <p className={cn('text-xs mt-0.5', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                  Deine zuletzt gemachten Angebote
                </p>
              </div>
            </div>

            <div className="p-5">
              {myOffers.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-3xl block mb-3">📋</span>
                  <p className={cn('text-sm', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                    Du hast noch keine Angebote gemacht.
                  </p>
                  <Link
                    href={IT_HILFE.routes.browse}
                    className="text-sm text-cyan-600 hover:underline mt-2 inline-block"
                  >
                    Anfragen durchsuchen
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myOffers.map(offer => (
                    <Link
                      key={offer.offerId}
                      href={IT_HILFE.routes.detail(offer.requestId)}
                      className="block p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 hover:border-cyan-200 dark:hover:border-cyan-700 hover:bg-cyan-50/30 dark:hover:bg-cyan-900/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm font-medium line-clamp-1', getTextColor('neutral', 'primary'), 'dark:text-white')}>
                          {offer.requestTitle}
                        </p>
                        <OfferStatusBadge status={offer.offerStatus} />
                      </div>
                      <p className={cn('text-xs mt-1', getTextColor('neutral', 'muted'), 'dark:text-neutral-400')}>
                        {offer.city}, {offer.canton}
                        {' · '}
                        Anfrage: {REQUEST_STATUS_LABELS[offer.requestStatus] ?? offer.requestStatus}
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
              'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
              getTextColor('neutral', 'primary'), 'dark:text-white',
              'hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors'
            )}
          >
            ✏️ Profil bearbeiten
          </Link>
          <Link
            href={IT_HILFE.routes.browse}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
              getTextColor('neutral', 'primary'), 'dark:text-white',
              'hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors'
            )}
          >
            🔍 Alle Anfragen
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium',
              'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
              getTextColor('neutral', 'muted'), 'dark:text-neutral-400',
              'hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors'
            )}
          >
            ← Zum Dashboard
          </Link>
        </div>

      </div>
    </main>
  )
}
