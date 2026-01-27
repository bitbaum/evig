/**
 * Admin Dashboard - Server Component
 *
 * Shows real-time data from the database.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { getAccessibleSections, isSuperAdmin } from '@/lib/permissions'
import { ADMIN_SECTIONS, type AdminSection } from '@/lib/permissions'
import {
  Users,
  Calendar,
  Wrench,
  UserCheck,
  ArrowRight,
  BarChart3,
  Package,
  CheckSquare,
  FileText,
  MapPin,
  Star,
  Brain,
  Settings,
  AlertCircle,
  Shield,
} from 'lucide-react'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { RequestAccessSection } from './RequestAccessSection'

export const metadata: Metadata = {
  title: 'Admin Dashboard | RevampIT',
  description: 'Verwalten Sie Ihr RevampIT-System als Administrator.',
}

// Icon mapping for sections
const SECTION_ICONS: Record<string, typeof Users> = {
  dashboard: BarChart3,
  products: Package,
  workshops: Calendar,
  services: Wrench,
  locations: MapPin,
  reviews: Star,
  content: FileText,
  approvals: CheckSquare,
  users: Users,
  team: UserCheck,
  finances: BarChart3,
  finanzen: BarChart3,
  kennzahlen: BarChart3,
  wirkung: BarChart3,
  transparenz: BarChart3,
  analytics: BarChart3,
  settings: Settings,
  hirn: Brain,
}

async function getDashboardStats() {
  try {
    // Get user count
    const usersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    const totalUsers = parseInt(usersResult.rows[0]?.count || '0')

    // Get staff count
    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    const totalStaff = parseInt(staffResult.rows[0]?.count || '0')

    // Get pending approvals (user_content_submissions with status='pending')
    let pendingApprovals = 0
    try {
      const approvalsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM user_content_submissions WHERE status = 'pending'`
      )
      pendingApprovals = parseInt(approvalsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    // Get technician count
    let totalTechnicians = 0
    try {
      const techResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM technician_profiles WHERE is_active = true`
      )
      totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist yet
    }

    return {
      totalUsers,
      totalStaff,
      pendingApprovals,
      totalTechnicians,
    }
  } catch (error) {
    return {
      totalUsers: 0,
      totalStaff: 0,
      pendingApprovals: 0,
      totalTechnicians: 0,
    }
  }
}

export default async function AdminDashboard() {
  const session = await auth()

  if (!session?.user) {
    return null
  }

  const stats = await getDashboardStats()
  const accessibleSections = getAccessibleSections({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  })
  const isSuper = isSuperAdmin(session.user.email)

  // Calculate sections the user doesn't have access to (for request form)
  const allSections = Object.keys(ADMIN_SECTIONS) as AdminSection[]
  const hasFullAccess = session.user.staffPermissions?.includes('*') || isSuper
  const inaccessibleSections = hasFullAccess ? [] : allSections
    .filter(s => !accessibleSections.includes(s) && s !== 'dashboard')
    .map(s => ({
      id: s,
      label: ADMIN_SECTIONS[s].label,
      description: ADMIN_SECTIONS[s].description,
    }))

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Willkommen, {session.user.name || session.user.email}
        </h1>
        <p className="text-green-100">
          {isSuper ? 'Super Admin' : 'Staff'} • {accessibleSections.length} Bereiche verfügbar
        </p>
      </div>

      {/* Key Metrics from Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Benutzer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              <p className="text-sm text-gray-500">Registriert</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Team</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStaff}</p>
              <p className="text-sm text-gray-500">Mitarbeitende</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Freigaben</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
              <p className="text-sm text-orange-600">Ausstehend</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Techniker</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTechnicians}</p>
              <p className="text-sm text-gray-500">Aktiv</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Wrench className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Accessible Sections Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Deine Bereiche
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Schnellzugriff auf verfügbare Admin-Bereiche
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {accessibleSections
              .filter(section => section !== 'dashboard')
              .map((section) => {
                const config = ADMIN_SECTIONS[section]
                const Icon = SECTION_ICONS[section]
                const isSensitive = config.sensitive

                return (
                  <Link
                    key={section}
                    href={config.path}
                    className="group p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSensitive
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-green-100 dark:bg-green-900/30'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          isSensitive ? 'text-red-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">
                          {config.label}
                        </h3>
                        {isSensitive && (
                          <span className="text-xs text-red-600">Sensibel</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {config.description}
                    </p>
                  </Link>
                )
              })}
          </div>
        </div>
      </div>

      {/* Super Admin: Permission Requests */}
      {isSuper && (
        <>
          {/* Pending Permission Requests */}
          <PermissionRequestsManager />

          {/* Super Admin Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" />
                Super Admin
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Berechtigungen verwalten und Freigaben erteilen
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/admin/users"
                  className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    <div>
                      <h3 className="font-medium text-purple-900 dark:text-purple-200">
                        Benutzer & Berechtigungen
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Staff-Berechtigungen verwalten
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-purple-600 ml-auto" />
                  </div>
                </Link>

                <Link
                  href="/admin/approvals"
                  className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-medium text-orange-900 dark:text-orange-200">
                        Freigaben ({stats.pendingApprovals})
                      </h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        Eingereichte Inhalte prüfen
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-orange-600 ml-auto" />
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Request More Access (for staff without full access) */}
      {!isSuper && !hasFullAccess && inaccessibleSections.length > 0 && (
        <RequestAccessSection inaccessibleSections={inaccessibleSections} />
      )}

      {/* Quick Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Schnellzugriff
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/hirn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          >
            <Brain className="w-4 h-4" />
            Hirn Dashboard
          </Link>
          <Link
            href="/admin/analyse/finanzen"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Finanzen
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            Zur Website
          </Link>
        </div>
      </div>
    </div>
  )
}
