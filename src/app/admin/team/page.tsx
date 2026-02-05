/**
 * Admin Team & HR Page - Server Component
 *
 * Main team management page with:
 * - Stats overview
 * - Permission requests (super admin only)
 * - Filterable team member grid
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import { Users, UserPlus, Briefcase, Crown, Shield } from 'lucide-react'
import Link from 'next/link'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { TeamListClient } from './TeamListClient'

export const metadata: Metadata = {
  title: 'Team & HR | RevampIT Admin',
  description: 'Mitarbeiter und Team verwalten.',
}

interface TeamStats {
  totalStaff: number
  totalProfiles: number
  byDepartment: Record<string, number>
  byType: Record<string, number>
}

async function getTeamStats(): Promise<TeamStats> {
  try {
    // Staff count
    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    const totalStaff = parseInt(staffResult.rows[0]?.count || '0')

    // Profiles count
    const profilesResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.TEAM_PROFILES}`
    )
    const totalProfiles = parseInt(profilesResult.rows[0]?.count || '0')

    // By department
    const deptResult = await query<{ department: string; count: string }>(
      `SELECT department, COUNT(*) as count FROM ${TABLE_NAMES.TEAM_PROFILES}
       WHERE department IS NOT NULL
       GROUP BY department`
    )
    const byDepartment: Record<string, number> = {}
    deptResult.rows.forEach(row => {
      byDepartment[row.department] = parseInt(row.count)
    })

    // By employment type
    const typeResult = await query<{ employment_type: string; count: string }>(
      `SELECT employment_type, COUNT(*) as count FROM ${TABLE_NAMES.TEAM_PROFILES}
       WHERE employment_type IS NOT NULL
       GROUP BY employment_type`
    )
    const byType: Record<string, number> = {}
    typeResult.rows.forEach(row => {
      byType[row.employment_type] = parseInt(row.count)
    })

    return { totalStaff, totalProfiles, byDepartment, byType }
  } catch (error) {
    logger.error('Failed to fetch team stats', { error })
    return { totalStaff: 0, totalProfiles: 0, byDepartment: {}, byType: {} }
  }
}

async function getStaffWithoutProfiles(): Promise<Array<{ id: string; name: string | null; email: string }>> {
  try {
    const result = await query<{ id: string; name: string | null; email: string }>(
      `SELECT u.id, u.name, u.email
       FROM ${TABLE_NAMES.USERS} u
       LEFT JOIN ${TABLE_NAMES.TEAM_PROFILES} tp ON u.id = tp.user_id
       WHERE u.is_staff = true AND tp.id IS NULL
       ORDER BY u.name ASC NULLS LAST, u.email ASC`
    )
    return result.rows
  } catch (error) {
    logger.error('Failed to fetch staff without profiles', { error })
    return []
  }
}

export default async function TeamPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'team')) {
    redirect('/admin?error=no_team_access')
  }

  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  const [stats, staffWithoutProfiles] = await Promise.all([
    getTeamStats(),
    getStaffWithoutProfiles(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team & HR
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mitarbeiter und Teammitglieder verwalten
            </p>
          </div>
        </div>
        <Link
          href="/admin/team/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Profil erstellen
        </Link>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStaff}</p>
              <p className="text-gray-600 dark:text-gray-400">Staff Gesamt</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalProfiles}</p>
              <p className="text-gray-600 dark:text-gray-400">Profile</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Object.values(stats.byDepartment).reduce((a, b) => a + b, 0) || 0}
              </p>
              <p className="text-gray-600 dark:text-gray-400">Mit Abteilung</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{staffWithoutProfiles.length}</p>
              <p className="text-gray-600 dark:text-gray-400">Ohne Profil</p>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Requests - Super Admin Only */}
      {currentUserIsSuperAdmin && (
        <PermissionRequestsManager />
      )}

      {/* Staff without profiles warning */}
      {staffWithoutProfiles.length > 0 && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
            {staffWithoutProfiles.length} Staff-Mitglieder ohne Profil
          </h3>
          <div className="flex flex-wrap gap-2">
            {staffWithoutProfiles.slice(0, 5).map(user => (
              <Link
                key={user.id}
                href={`/admin/team/new?user_id=${user.id}`}
                className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 text-sm rounded-full hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors"
              >
                {user.name || user.email}
              </Link>
            ))}
            {staffWithoutProfiles.length > 5 && (
              <span className="px-3 py-1 text-yellow-700 dark:text-yellow-400 text-sm">
                +{staffWithoutProfiles.length - 5} weitere
              </span>
            )}
          </div>
        </div>
      )}

      {/* Team List with Filters (Client Component) */}
      <TeamListClient />

      {/* Info Boxes */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>Sensible Daten:</strong> Diese Seite enthält vertrauliche Team-Informationen und ist nur für autorisierte Mitarbeiter zugänglich.
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Hinweis:</strong> Benutzer mit @revamp-it.ch E-Mail-Adresse werden automatisch als Staff erkannt.
          </p>
        </div>
      </div>
    </div>
  )
}
