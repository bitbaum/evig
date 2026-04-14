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
 */

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
} from '@/components/admin/dashboard'
import Heading from '@/components/ui/Heading'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalte das RevampIT-System.',
}

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const isSuper = isSuperAdmin(session.user.email)
  const stats = await getDashboardStats(isSuper)

  const userForPermissions = {
    email: session.user.email ?? '',
    is_staff: session.user.isStaff ?? false,
    staff_permissions: session.user.staffPermissions ?? [],
  }

  const accessibleSections = getAccessibleSections(userForPermissions)

  // Sections the user doesn't have access to (for request form)
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
  const queueItems = buildUnifiedQueue(stats, isSuper, canAccess)
  const quickActions = buildQuickActions(canAccess)

  const userId = session.user.id ?? ''
  const isMember = !!(session.user as { isMember?: boolean }).isMember

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
          Hallo, {session.user.name?.split(' ')[0] || 'Admin'}
        </Heading>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isSuper ? 'Super Admin' : 'Staff'}
        </p>
      </div>

      {/* Voting banner — appears only when user has uncast votes */}
      {userId && (
        <VotingBanner userId={userId} isSuper={isSuper} isMember={isMember} />
      )}

      {/* Personal: my tasks + my submitted content */}
      {userId && (
        <PersonalSection userId={userId} />
      )}

      {/* Org-wide queue */}
      <UnifiedQueue items={queueItems} />

      {/* Create strip */}
      <CreateStrip actions={quickActions} />

      {/* Super Admin: Permission Requests */}
      {isSuper && stats.pendingPermissionRequests > 0 && (
        <div id="permission-requests">
          <PermissionRequestsManager />
        </div>
      )}

      {/* Monatsüberblick — collapsed by default */}
      <Monatsueberblick stats={stats} />

      {/* Request More Access (for staff without full access) */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}
    </div>
  )
}
