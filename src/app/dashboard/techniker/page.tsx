import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import {
  URGENCY_LEVELS,
  OFFER_STATUSES,
  IT_HILFE,
  formatBudget,
} from '@/config/it-hilfe'

export const metadata: Metadata = {
  title: 'Techniker Dashboard | RevampIT',
  description: 'Verwalte deine IT-Hilfe Anfragen und Angebote.',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TechnicianProfile {
  id: string
  totalJobsCompleted: number
  averageRating: string
  isActive: boolean
  city: string
}

interface MatchingRequest {
  id: string
  title: string
  categoryId: string
  urgency: string
  budgetTier: string | null
  budgetAmountCents: number | null
  city: string
  canton: string
  offerCount: number
  createdAt: string
}

interface MyOffer {
  offerId: string
  offerStatus: string
  offerCreatedAt: string
  requestId: string
  requestTitle: string
  categoryId: string
  urgency: string
  city: string
  canton: string
  requestStatus: string
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getTechnicianProfile(userId: string): Promise<TechnicianProfile | null> {
  try {
    const result = await query<{
      id: string
      total_jobs_completed: number
      average_rating: string
      is_active: boolean
      city: string
    }>(
      `SELECT id, total_jobs_completed, average_rating, is_active, city
       FROM ${TABLE_NAMES.REPAIRER_PROFILES}
       WHERE user_id = $1
       LIMIT 1`,
      [userId]
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      id: row.id,
      totalJobsCompleted: row.total_jobs_completed ?? 0,
      averageRating: row.average_rating ?? '0.0',
      isActive: row.is_active ?? false,
      city: row.city ?? '',
    }
  } catch (error) {
    logger.error('Error fetching technician profile', { error, userId })
    return null
  }
}

async function getActiveOfferCount(userId: string): Promise<number> {
  try {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM ${TABLE_NAMES.IT_HILFE_OFFERS}
       WHERE helper_id = $1 AND status = 'pending'`,
      [userId]
    )
    return parseInt(result.rows[0]?.count ?? '0', 10)
  } catch (error) {
    logger.error('Error fetching active offer count', { error, userId })
    return 0
  }
}

async function getMatchingRequests(userId: string): Promise<MatchingRequest[]> {
  try {
    // Get helper's skill IDs from user_skills
    const skillResult = await query<{ skill_id: string }>(
      `SELECT skill_id FROM ${TABLE_NAMES.USER_SKILLS} WHERE user_id = $1`,
      [userId]
    )
    const skillIds = skillResult.rows.map(r => r.skill_id)

    if (skillIds.length === 0) {
      // No skills registered: return open requests (fallback)
      const result = await query<{
        id: string
        title: string
        category_id: string
        urgency: string
        budget_tier: string | null
        budget_amount_cents: number | null
        city: string
        canton: string
        offer_count: number
        created_at: string
      }>(
        `SELECT r.id, r.title, r.category_id, r.urgency, r.budget_tier,
                r.budget_amount_cents, r.city, r.canton, r.offer_count, r.created_at
         FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
         LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} o
           ON o.request_id = r.id AND o.helper_id = $1
         WHERE r.status = 'open'
           AND (r.expires_at IS NULL OR r.expires_at > NOW())
           AND o.id IS NULL
         ORDER BY r.created_at DESC
         LIMIT 5`,
        [userId]
      )
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        categoryId: row.category_id,
        urgency: row.urgency,
        budgetTier: row.budget_tier,
        budgetAmountCents: row.budget_amount_cents,
        city: row.city,
        canton: row.canton,
        offerCount: row.offer_count ?? 0,
        createdAt: row.created_at,
      }))
    }

    // Build parameterized skill array for overlap check
    const skillParams = skillIds.map((_, i) => `$${i + 2}`).join(', ')
    const result = await query<{
      id: string
      title: string
      category_id: string
      urgency: string
      budget_tier: string | null
      budget_amount_cents: number | null
      city: string
      canton: string
      offer_count: number
      created_at: string
    }>(
      `SELECT r.id, r.title, r.category_id, r.urgency, r.budget_tier,
              r.budget_amount_cents, r.city, r.canton, r.offer_count, r.created_at
       FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
       LEFT JOIN ${TABLE_NAMES.IT_HILFE_OFFERS} o
         ON o.request_id = r.id AND o.helper_id = $1
       WHERE r.status = 'open'
         AND (r.expires_at IS NULL OR r.expires_at > NOW())
         AND r.skills_needed && ARRAY[${skillParams}]::text[]
         AND o.id IS NULL
       ORDER BY r.created_at DESC
       LIMIT 5`,
      [userId, ...skillIds]
    )

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      categoryId: row.category_id,
      urgency: row.urgency,
      budgetTier: row.budget_tier,
      budgetAmountCents: row.budget_amount_cents,
      city: row.city,
      canton: row.canton,
      offerCount: row.offer_count ?? 0,
      createdAt: row.created_at,
    }))
  } catch (error) {
    logger.error('Error fetching matching requests', { error, userId })
    return []
  }
}

async function getMyOffers(userId: string): Promise<MyOffer[]> {
  try {
    const result = await query<{
      offer_id: string
      offer_status: string
      offer_created_at: string
      request_id: string
      request_title: string
      category_id: string
      urgency: string
      city: string
      canton: string
      request_status: string
    }>(
      `SELECT
         o.id AS offer_id,
         o.status AS offer_status,
         o.created_at AS offer_created_at,
         r.id AS request_id,
         r.title AS request_title,
         r.category_id,
         r.urgency,
         r.city,
         r.canton,
         r.status AS request_status
       FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
       JOIN ${TABLE_NAMES.IT_HILFE_REQUESTS} r ON o.request_id = r.id
       WHERE o.helper_id = $1
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [userId]
    )

    return result.rows.map(row => ({
      offerId: row.offer_id,
      offerStatus: row.offer_status,
      offerCreatedAt: row.offer_created_at,
      requestId: row.request_id,
      requestTitle: row.request_title,
      categoryId: row.category_id,
      urgency: row.urgency,
      city: row.city,
      canton: row.canton,
      requestStatus: row.request_status,
    }))
  } catch (error) {
    logger.error('Error fetching my offers', { error, userId })
    return []
  }
}

// ---------------------------------------------------------------------------
// Helper UI components
// ---------------------------------------------------------------------------

function UrgencyBadge({ urgency }: { urgency: string }) {
  const level = URGENCY_LEVELS.find(u => u.id === urgency)
  if (!level) return null
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', level.badgeClass)}>
      {level.name}
    </span>
  )
}

function OfferStatusBadge({ status }: { status: string }) {
  const s = OFFER_STATUSES.find(o => o.id === status)
  if (!s) return null
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', s.badgeClass)}>
      {s.name}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

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

  // No profile yet — show CTA
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
              Übersicht Ihrer IT-Hilfe Aktivitäten
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
                  Offene Anfragen, die Ihren Skills entsprechen
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
                  Ihre zuletzt gemachten Angebote
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
                        Anfrage: {
                          (() => {
                            const rs = offer.requestStatus
                            if (rs === 'open') return 'Offen'
                            if (rs === 'in_discussion') return 'In Gespräch'
                            if (rs === 'matched') return 'Vergeben'
                            if (rs === 'completed') return 'Abgeschlossen'
                            if (rs === 'cancelled') return 'Abgebrochen'
                            return rs
                          })()
                        }
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
