/**
 * /admin — Dashboard.
 *
 * Layout principle: flat document, not stacked cards. Each block is a
 * <section> with an eyebrow + content, separated by `space-y-12` on
 * the article. The page reads top-to-bottom like a brief, not like a
 * spreadsheet of widgets.
 *
 * Streaming pattern preserved from the prior version: VotingBanner and
 * PersonalSection run their own queries in parallel; UnifiedQueue and
 * Monatsüberblick share a single getDashboardStats() Promise so the DB
 * is queried exactly once.
 *
 * Responsible to its audience: the dashboard is the staff member's
 * entry point. The eyebrow on each section answers "what is this for?"
 * before the data appears, so the page is legible even mid-skeleton.
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { ORG } from '@/config/org'
import { getAccessibleSections, isSuperAdmin, canAccessSection } from '@/lib/permissions'
import { ADMIN_SECTIONS } from '@/lib/permissions'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { RequestAccessSection } from './RequestAccessSection'
import {
  getDashboardStats,
  buildQuickActions,
  buildUnifiedQueue,
  UnifiedQueue,
  CreateStrip,
  Monatsueberblick,
  VotingBanner,
  PersonalSection,
  BannerSkeleton,
  PersonalSectionSkeleton,
  UnifiedQueueSkeleton,
  DashboardModeToggle,
} from '@/components/admin/dashboard'
import { TeamActivityFeed } from '@/components/admin/dashboard/TeamActivityFeed'
import { SystemHealthBar } from '@/components/admin/dashboard/SystemHealthBar'
import type { DashboardStats } from '@/components/admin/dashboard'

type DashboardMode = 'coordinator' | 'lead' | 'volunteer'

export const metadata: Metadata = {
  title: 'Admin',
  description: `Verwalte das ${ORG.name}-System.`,
}

// Stable, server-safe date string — no Date.now/Math.random in the body.
function todayLongLabel(): string {
  return new Intl.DateTimeFormat('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

// ── Streaming wrappers ─────────────────────────────────────────────

async function UnifiedQueueSection({
  statsPromise,
  isSuper,
  canAccess,
}: {
  statsPromise: Promise<DashboardStats>
  isSuper: boolean
  canAccess: (section: string) => boolean
}) {
  const stats = await statsPromise
  const items = buildUnifiedQueue(stats, isSuper, canAccess)
  return <UnifiedQueue items={items} />
}

async function MonatsueberblickSection({
  statsPromise,
  mode,
}: {
  statsPromise: Promise<DashboardStats>
  mode: DashboardMode
}) {
  const stats = await statsPromise
  return (
    <Monatsueberblick stats={stats} defaultOpen={mode === 'lead'}>
      {mode === 'lead' && <TeamActivityFeed />}
      <SystemHealthBar />
    </Monatsueberblick>
  )
}

async function PermissionRequestsSection({
  statsPromise,
  isSuper,
}: {
  statsPromise: Promise<DashboardStats>
  isSuper: boolean
}) {
  if (!isSuper) return null
  const stats = await statsPromise
  if (stats.pendingPermissionRequests === 0) return null
  return (
    <section id="permission-requests" aria-labelledby="dashboard-perm-title">
      <h2
        id="dashboard-perm-title"
        className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary"
      >
        Zugriffs-Anfragen
      </h2>
      <div className="mt-3">
        <PermissionRequestsManager />
      </div>
    </section>
  )
}

// ── Page ────────────────────────────────────────────────────────────

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user) return null

  const isSuper = isSuperAdmin(session.user.email)
  const statsPromise = getDashboardStats(isSuper)

  const userForPermissions = {
    email: session.user.email ?? '',
    is_staff: session.user.isStaff ?? false,
    staff_permissions: session.user.staffPermissions ?? [],
  }

  const accessibleSections = getAccessibleSections(userForPermissions)
  const allSections = Object.keys(ADMIN_SECTIONS)
  const hasFullAccess = session.user.staffPermissions?.includes('*') || isSuper
  const inaccessibleSections = hasFullAccess
    ? []
    : allSections
        .filter(s => !accessibleSections.includes(s) && s !== 'dashboard')
        .map(s => ({
          id: s,
          label: ADMIN_SECTIONS[s]?.label ?? s,
          description: ADMIN_SECTIONS[s]?.description ?? '',
        }))

  const canAccess = (section: string) => canAccessSection(userForPermissions, section)
  const quickActions = buildQuickActions(canAccess)

  const userId = session.user.id ?? ''
  const isMember = !!(session.user as { isMember?: boolean }).isMember
  const dashboardMode: DashboardMode =
    (session.user as { dashboardMode?: DashboardMode }).dashboardMode ?? 'coordinator'
  const firstName = session.user.name?.split(' ')[0] || 'Admin'

  return (
    <article className="space-y-12 pb-12">
      {/* Header — date in mono on top, big greeting, subtle mode toggle */}
      <header className="flex flex-col gap-4 border-b border-subtle pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
            {todayLongLabel()} · {isSuper ? 'Super Admin' : 'Staff'}
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-text-primary sm:text-4xl">
            Hallo, {firstName}.
          </h1>
        </div>
        <DashboardModeToggle current={dashboardMode} />
      </header>

      {/* AUF DEINEM TISCH — combines voting + personal + org queue.
          Each streams independently; they share a top-level eyebrow
          group in the layout so the visual block "what needs me" is
          legible even mid-load. */}
      {userId && (
        <Suspense fallback={<BannerSkeleton />}>
          <VotingBanner userId={userId} isSuper={isSuper} isMember={isMember} />
        </Suspense>
      )}

      {userId && (
        <Suspense fallback={<PersonalSectionSkeleton />}>
          <PersonalSection userId={userId} />
        </Suspense>
      )}

      <Suspense fallback={<UnifiedQueueSkeleton />}>
        <UnifiedQueueSection
          statsPromise={statsPromise}
          isSuper={isSuper}
          canAccess={canAccess}
        />
      </Suspense>

      {/* SCHNELL ERSTELLEN */}
      <CreateStrip actions={quickActions} />

      {/* ZUGRIFFS-ANFRAGEN — super admin only, only when pending */}
      <Suspense fallback={null}>
        <PermissionRequestsSection statsPromise={statsPromise} isSuper={isSuper} />
      </Suspense>

      {/* MONATSÜBERBLICK — collapsed by default except for 'lead' mode */}
      <Suspense fallback={null}>
        <MonatsueberblickSection statsPromise={statsPromise} mode={dashboardMode} />
      </Suspense>

      {/* Request more access — bottom of page, only for limited users */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}
    </article>
  )
}
