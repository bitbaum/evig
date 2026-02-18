/**
 * Admin Dashboard - Task-Oriented UX
 *
 * Redesigned to show what needs action first, then quick actions,
 * then activity metrics, with reference stats at the bottom.
 *
 * Design principles:
 * 1. Task-first: Show what needs action, not abstract stats
 * 2. Clear hierarchy: Visual weight = importance
 * 3. 1-click actions: Most common workflows immediately accessible
 * 4. Progressive disclosure: Important first, details on demand
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { Shield } from 'lucide-react'
import { getAccessibleSections, isSuperAdmin, canAccessSection } from '@/lib/permissions'
import { ADMIN_SECTIONS } from '@/lib/permissions'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { RequestAccessSection } from './RequestAccessSection'
import {
  getDashboardStats,
  buildActionItems,
  buildQuickActions,
  ActionItemsSection,
  QuickActionsSection,
  WeeklyActivitySection,
  StatsOverview,
} from '@/components/admin/dashboard'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-System als Administrator.',
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

  // Calculate sections the user doesn't have access to (for request form)
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
  const actionItems = buildActionItems(stats, isSuper, canAccess)
  const quickActions = buildQuickActions(canAccess)

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hallo, {session.user.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSuper ? 'Super Admin' : 'Staff'} &bull; {accessibleSections.length} Bereiche
          </p>
        </div>
      </div>

      <ActionItemsSection actionItems={actionItems} />
      <QuickActionsSection quickActions={quickActions} />
      <WeeklyActivitySection stats={stats} />

      {/* Super Admin: Permission Requests (inline) */}
      {isSuper && stats.pendingPermissionRequests > 0 && (
        <div id="permission-requests">
          <PermissionRequestsManager />
        </div>
      )}

      <StatsOverview stats={stats} />

      {/* Request More Access (for staff without full access) */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}

      {/* Super Admin: No pending requests notice */}
      {isSuper && stats.pendingPermissionRequests === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              Super Admin &bull; Keine offenen Berechtigungsanfragen
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
