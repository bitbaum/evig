/**
 * Admin Team & HR Page - Server Component
 *
 * Main team management page with:
 * - Stats overview
 * - Permission requests (super admin only)
 * - Filterable team member grid
 */

import { Metadata } from 'next'
import { ORG } from '@/config/org'
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
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid } from '@/components/admin/AdminStatsGrid'
import type { StatCardItem } from '@/components/admin/AdminStatsGrid'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Team & HR',
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
    <AdminPageWrapper
      title="Team & HR"
      description="Mitarbeiter und Teammitglieder verwalten"
      icon={Users}
      iconColor="purple"
      actions={
        <Link
          href="/admin/team/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <UserPlus className="w-5 h-5" />
          Profil erstellen
        </Link>
      }
    >
      {/* Stats */}
      <AdminStatsGrid items={[
        {
          icon: Briefcase,
          color: 'blue',
          label: 'Staff Gesamt',
          value: stats.totalStaff,
        },
        {
          icon: Crown,
          color: 'purple',
          label: 'Profile',
          value: stats.totalProfiles,
        },
        {
          icon: Shield,
          color: 'green',
          label: 'Mit Abteilung',
          value: Object.values(stats.byDepartment).reduce((a, b) => a + b, 0) || 0,
        },
        {
          icon: UserPlus,
          color: 'orange',
          label: 'Ohne Profil',
          value: staffWithoutProfiles.length,
        },
      ] satisfies StatCardItem[]} />

      {/* Permission Requests - Super Admin Only */}
      {currentUserIsSuperAdmin && (
        <PermissionRequestsManager />
      )}

      {/* Staff without profiles warning */}
      {staffWithoutProfiles.length > 0 && (
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
          <Heading level={3} className="font-medium text-warning-900 dark:text-warning-200 mb-2">
            {staffWithoutProfiles.length} Staff-Mitglieder ohne Profil
          </Heading>
          <div className="flex flex-wrap gap-2">
            {staffWithoutProfiles.slice(0, 5).map(user => (
              <Link
                key={user.id}
                href={`/admin/team/new?user_id=${user.id}`}
                className="px-3 py-1 bg-warning-100 dark:bg-warning-900/40 text-warning-800 dark:text-warning-300 text-sm rounded-full hover:bg-warning-200 dark:hover:bg-warning-900/60 transition-colors"
              >
                {user.name || user.email}
              </Link>
            ))}
            {staffWithoutProfiles.length > 5 && (
              <span className="px-3 py-1 text-warning-700 dark:text-warning-400 text-sm">
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
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-xl">
          <p className="text-sm text-warning-700 dark:text-warning-300">
            <strong>Sensible Daten:</strong> Diese Seite enthält vertrauliche Team-Informationen und ist nur für autorisierte Mitarbeiter zugänglich.
          </p>
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-white/[0.06] rounded-xl">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong>Hinweis:</strong> Benutzer mit @{ORG.emailDomain} E-Mail-Adresse werden automatisch als Staff erkannt.
          </p>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
