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
import Link from 'next/link'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { getAccessibleSections, isSuperAdmin, canAccessSection } from '@/lib/permissions'
import { ADMIN_SECTIONS } from '@/lib/permissions'
import {
  Users,
  Wrench,
  UserCheck,
  ArrowRight,
  Package,
  CheckSquare,
  FileText,
  MapPin,
  GraduationCap,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  Check,
} from 'lucide-react'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { RequestAccessSection } from './RequestAccessSection'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-System als Administrator.',
}

interface DashboardStats {
  // Action items
  pendingApprovals: number
  pendingPermissionRequests: number
  pendingAppointments: number

  // Activity (this week)
  newUsersThisWeek: number
  postsPublishedThisWeek: number

  // Reference stats
  totalUsers: number
  totalStaff: number
  totalTechnicians: number
}

async function getDashboardStats(isSuper: boolean): Promise<DashboardStats> {
  const stats: DashboardStats = {
    pendingApprovals: 0,
    pendingPermissionRequests: 0,
    pendingAppointments: 0,
    newUsersThisWeek: 0,
    postsPublishedThisWeek: 0,
    totalUsers: 0,
    totalStaff: 0,
    totalTechnicians: 0,
  }

  try {
    // Get total user count
    const usersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    stats.totalUsers = parseInt(usersResult.rows[0]?.count || '0')

    // Get staff count
    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    stats.totalStaff = parseInt(staffResult.rows[0]?.count || '0')

    // Get pending content approvals
    try {
      const approvalsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE status = 'pending'`
      )
      stats.pendingApprovals = parseInt(approvalsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get pending permission requests (super admin only)
    if (isSuper) {
      try {
        const permissionsResult = await query<{ count: string }>(
          `SELECT COUNT(*) as count FROM ${TABLE_NAMES.STAFF_PERMISSION_REQUESTS} WHERE status = 'pending'`
        )
        stats.pendingPermissionRequests = parseInt(permissionsResult.rows[0]?.count || '0')
      } catch {
        // Table might not exist yet
      }
    }

    // Get pending service appointments
    try {
      const appointmentsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SERVICE_APPOINTMENTS} WHERE status = 'pending'`
      )
      stats.pendingAppointments = parseInt(appointmentsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get technician count
    try {
      const techResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true`
      )
      stats.totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get new users this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const newUsersResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}
         WHERE created_at >= $1`,
        [weekAgo.toISOString()]
      )
      stats.newUsersThisWeek = parseInt(newUsersResult.rows[0]?.count || '0')
    } catch {
      // Column might not exist
    }

    // Get posts published this week
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const postsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.BLOG_POSTS}
         WHERE status = 'published' AND published_at >= $1`,
        [weekAgo.toISOString()]
      )
      stats.postsPublishedThisWeek = parseInt(postsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    return stats
  } catch {
    return stats
  }
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

  // Build action items list
  const actionItems: Array<{
    type: 'urgent' | 'warning' | 'success'
    label: string
    count?: number
    href: string
    actionLabel: string
  }> = []

  // Pending approvals
  if (stats.pendingApprovals > 0 && canAccessSection(userForPermissions, 'approvals')) {
    actionItems.push({
      type: 'urgent',
      label: `${stats.pendingApprovals} Freigabe${stats.pendingApprovals > 1 ? 'n' : ''} warten`,
      count: stats.pendingApprovals,
      href: '/admin/approvals',
      actionLabel: 'Jetzt prüfen',
    })
  }

  // Pending permission requests (super admin only)
  if (isSuper && stats.pendingPermissionRequests > 0) {
    actionItems.push({
      type: 'warning',
      label: `${stats.pendingPermissionRequests} Berechtigungsanfrage${stats.pendingPermissionRequests > 1 ? 'n' : ''}`,
      count: stats.pendingPermissionRequests,
      href: '#permission-requests',
      actionLabel: 'Ansehen',
    })
  }

  // Pending appointments
  if (stats.pendingAppointments > 0 && canAccessSection(userForPermissions, 'services')) {
    actionItems.push({
      type: 'warning',
      label: `${stats.pendingAppointments} Termin${stats.pendingAppointments > 1 ? 'e' : ''} ausstehend`,
      count: stats.pendingAppointments,
      href: '/admin/services/appointments',
      actionLabel: 'Ansehen',
    })
  }

  // No pending items message
  const hasNoActionItems = actionItems.length === 0

  // Quick actions based on user permissions
  const quickActions: Array<{
    label: string
    href: string
    icon: typeof Package
    color: string
  }> = []

  if (canAccessSection(userForPermissions, 'content')) {
    quickActions.push({
      label: 'Neuer Artikel',
      href: '/admin/content/blog/new',
      icon: FileText,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    })
  }

  if (canAccessSection(userForPermissions, 'products')) {
    quickActions.push({
      label: 'Neues Produkt',
      href: '/admin/products/new',
      icon: Package,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50',
    })
  }

  if (canAccessSection(userForPermissions, 'workshops-admin')) {
    quickActions.push({
      label: 'Neuer Workshop',
      href: '/admin/workshops/new',
      icon: GraduationCap,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    })
  }

  if (canAccessSection(userForPermissions, 'services')) {
    quickActions.push({
      label: 'Neue Dienstleistung',
      href: '/admin/services/new',
      icon: Wrench,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50',
    })
  }

  if (canAccessSection(userForPermissions, 'locations')) {
    quickActions.push({
      label: 'Neuer Standort',
      href: '/admin/locations/new',
      icon: MapPin,
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 hover:bg-teal-200 dark:hover:bg-teal-900/50',
    })
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Simplified */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Hallo, {session.user.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSuper ? 'Super Admin' : 'Staff'} • {accessibleSections.length} Bereiche
          </p>
        </div>
      </div>

      {/* Section 1: Action Items - Most Important */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Was gibt es zu tun?
          </h2>
        </div>

        <div className="p-4">
          {hasNoActionItems ? (
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <span className="font-medium">Alles erledigt! Keine offenen Aufgaben.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {actionItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        item.type === 'urgent'
                          ? 'bg-red-500'
                          : item.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.label}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    {item.actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Schnellaktionen
            </h2>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link
                    key={index}
                    href={action.href}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-colors ${action.color}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm font-medium text-center">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Activity Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Diese Woche
          </h2>
        </div>

        <div className="p-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-green-600">+{stats.newUsersThisWeek}</span>{' '}
              neue Benutzer
            </span>
            <span className="text-gray-400 dark:text-gray-500">•</span>
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold text-blue-600">{stats.postsPublishedThisWeek}</span>{' '}
              Artikel veröffentlicht
            </span>
          </div>
        </div>
      </div>

      {/* Super Admin: Permission Requests (inline) */}
      {isSuper && stats.pendingPermissionRequests > 0 && (
        <div id="permission-requests">
          <PermissionRequestsManager />
        </div>
      )}

      {/* Section 4: Stats Overview - Smaller, at bottom */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/users"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Benutzer</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/team"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalStaff}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Team</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/approvals"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingApprovals}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Freigaben</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/services"
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalTechnicians}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Techniker</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Request More Access (for staff without full access) */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}

      {/* Super Admin: Additional Info (collapsed) */}
      {isSuper && stats.pendingPermissionRequests === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Shield className="w-4 h-4" />
            <span className="text-sm">
              Super Admin • Keine offenen Berechtigungsanfragen
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
