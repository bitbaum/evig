/**
 * Admin Dashboard — Task-Oriented UX
 *
 * Layout (top to bottom):
 * 1. Greeting
 * 2. VotingBanner — pending decisions the current user hasn't voted on
 * 3. PersonalSection — my assigned tasks + my submitted content
 * 4. UnifiedQueue — org-wide "Wartet auf Bearbeitung" (merged action items)
 * 5. CreateStrip — compact creation shortcuts
 * 6. Permission requests — super admin only
 * 7. Monatsüberblick — collapsible mission metrics
 *
 * Streaming: VotingBanner and PersonalSection run their own queries in
 * parallel via Suspense. UnifiedQueue and Monatsüberblick share a single
 * getDashboardStats() Promise so the DB is queried only once, then both
 * sections stream when it resolves.
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
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
import Heading from '@/components/admin/AdminHeading'
import type { DashboardStats } from '@/components/admin/dashboard'

type DashboardMode = 'coordinator' | 'lead' | 'volunteer'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalte das RevampIT-System.',
}

// ---------------------------------------------------------------------------
// Async section wrappers — await the shared statsPromise so the DB is only
// queried once, then feed results to the respective rendering component.
// ---------------------------------------------------------------------------

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
    <div id="permission-requests">
      <PermissionRequestsManager />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const isSuper = isSuperAdmin(session.user.email)

  // Start stats fetch — NOT awaited here. Shared across Suspense sections so
  // the DB is queried exactly once.
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
  const dashboardMode: DashboardMode = (session.user as { dashboardMode?: DashboardMode }).dashboardMode ?? 'coordinator'

  return (
    <div className="space-y-4">
      {/* Greeting — renders immediately, no data needed */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
            Hallo, {session.user.name?.split(' ')[0] || 'Admin'}
          </Heading>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isSuper ? 'Super Admin' : 'Staff'}
          </p>
        </div>
        <DashboardModeToggle current={dashboardMode} />
      </div>

      {/* VotingBanner — runs its own query, streams independently */}
      {userId && (
        <Suspense fallback={<BannerSkeleton />}>
          <VotingBanner userId={userId} isSuper={isSuper} isMember={isMember} />
        </Suspense>
      )}

      {/* PersonalSection — runs its own queries, streams independently */}
      {userId && (
        <Suspense fallback={<PersonalSectionSkeleton />}>
          <PersonalSection userId={userId} />
        </Suspense>
      )}

      {/* UnifiedQueue — shares statsPromise, streams when stats resolve */}
      <Suspense fallback={<UnifiedQueueSkeleton />}>
        <UnifiedQueueSection
          statsPromise={statsPromise}
          isSuper={isSuper}
          canAccess={canAccess}
        />
      </Suspense>

      {/* CreateStrip — synchronous, renders immediately */}
      <CreateStrip actions={quickActions} />

      {/* PermissionRequestsManager — shares statsPromise, hidden for most users */}
      <Suspense fallback={null}>
        <PermissionRequestsSection statsPromise={statsPromise} isSuper={isSuper} />
      </Suspense>

      {/* Monatsüberblick — shares statsPromise; expanded by default for 'lead' mode */}
      <Suspense fallback={null}>
        <MonatsueberblickSection statsPromise={statsPromise} mode={dashboardMode} />
      </Suspense>

      {/* Request More Access — synchronous */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}
    </div>
  )
}
