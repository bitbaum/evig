/**
 * /dashboard — user self-management hub.
 *
 * Phase 2 of the admin/user-split redesign.
 *
 * Visual language matches the redesigned /admin: eyebrow + flat-document
 * layout, no card-stacking. Sections grouped by SSOT category
 * (account / activities / commerce / services / content / admin), each
 * rendered as an eyebrow + a divide-y list of thin link rows. The
 * "wall of cards" grid is gone — comprehensive without overwhelming.
 *
 * Customer chrome (AppShell) wraps this page, so it stays visually
 * distinct from /admin while sharing the same typographic discipline.
 */

import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ROLES, type UserRole } from '@/lib/constants'
import { isSuperAdmin } from '@/lib/permissions'
import {
  getAllDashboardCards,
  DASHBOARD_CATEGORIES,
  type DashboardCategory,
  type DashboardCard,
} from '@/config/dashboard'
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner'
import { OnboardingChecklist } from '@/components/dashboard/OnboardingChecklist'
import { getOnboardingChecklistState } from '@/lib/services/onboarding-state'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('dashboard.meta')
  return { title: t('dashboardTitle'), description: t('dashboardDesc') }
}

// Category render order — accounts first (most-clicked: profile/settings),
// then activities, then commerce, services, content, and admin last.
const CATEGORY_ORDER: DashboardCategory[] = [
  'account',
  'activities',
  'commerce',
  'services',
  'content',
  'admin',
]

// Semantic dot colour per card.color — small visual key without the
// heavy icon-box that the previous grid layout used.
const DOT_BY_COLOR: Record<DashboardCard['color'], string> = {
  info: 'bg-action',
  success: 'bg-action',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  secondary: 'bg-secondary-500',
  neutral: 'bg-text-muted',
}

// Stable de-CH date for the header kicker. Server-rendered per request.
function todayLongLabel(): string {
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
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

  const cardsByCategory = new Map<DashboardCategory, DashboardCard[]>()
  for (const card of cards) {
    const bucket = cardsByCategory.get(card.category) ?? []
    bucket.push(card)
    cardsByCategory.set(card.category, bucket)
  }

  const visibleCategories = CATEGORY_ORDER.filter(c => (cardsByCategory.get(c)?.length ?? 0) > 0)
  const firstName = session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'Du'
  const userRole = (session.user.role as UserRole) || ROLES.CUSTOMER
  const onboardingState = await getOnboardingChecklistState(
    session.user.id,
    userRole,
    session.user.emailVerified ?? false,
  )

  return (
    <main className="min-h-screen bg-canvas">
      <article className="mx-auto max-w-4xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="border-b border-subtle pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {todayLongLabel()} · {t('subtitle')}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
            Hallo, {firstName}.
          </h1>
        </header>

        {/* Inline status: email verification + onboarding */}
        {!session.user.emailVerified && session.user.email && (
          <EmailVerificationBanner email={session.user.email} />
        )}
        <OnboardingChecklist role={userRole} {...onboardingState} />

        {/* Category sections — each is an eyebrow + divide-y list of links.
            No outer wrapper card; the list itself has the only border. */}
        {visibleCategories.map(categoryKey => {
          const config = DASHBOARD_CATEGORIES[categoryKey]
          const categoryCards = cardsByCategory.get(categoryKey) ?? []
          return (
            <section key={categoryKey} aria-labelledby={`cat-${categoryKey}`}>
              <h2
                id={`cat-${categoryKey}`}
                className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
              >
                {config.title}
              </h2>
              <ul className="mt-3 divide-y divide-subtle rounded-lg border border-subtle bg-surface-base">
                {categoryCards.map(card => (
                  <li key={card.id}>
                    <Link
                      href={card.href}
                      className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-raised"
                    >
                      {/* Color dot — semantic, replaces the heavy icon box.
                          The card.icon (an emoji) follows for quick visual
                          recognition without the giant tile. */}
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${DOT_BY_COLOR[card.color]}`}
                        aria-hidden="true"
                      />
                      <span aria-hidden="true" className="text-base">
                        {card.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-text-primary">
                            {card.title}
                          </p>
                          {card.badge && (
                            <span className="rounded-sm bg-action-muted px-1.5 py-0.5 text-xs font-medium text-action">
                              {card.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-text-tertiary">
                          {card.description}
                        </p>
                      </div>
                      <ArrowRight
                        className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-action"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </article>
    </main>
  )
}
