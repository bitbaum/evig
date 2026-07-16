/**
 * Admin Team & HR Page - Server Component
 *
 * Main team management page with:
 * - Stats overview
 * - Permission requests (super admin only)
 * - Filterable team member grid
 */

import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ORG } from '@/config/org'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import { requireSection } from '@/lib/admin/guards'
import { logger } from '@/lib/logger'
import { Users, UserPlus, Briefcase, Crown, Shield } from 'lucide-react'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { ROUTES } from '@/config/routes'
import { PermissionRequestsManager } from '@/components/admin/PermissionRequestsManager'
import { TeamListClient } from './TeamListClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsStrip } from '@/components/admin/AdminStatsStrip'
import type { StatItem } from '@/components/admin/AdminStatsStrip'
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
  const session = await requireSection('team')
  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)
  const t = await getTranslations('admin.team')

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
        <div className="flex flex-wrap items-center gap-2">
          <Link href={ROUTES.admin.hrApplications} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            <Briefcase className="w-4 h-4" />
            Bewerbungen
          </Link>
          <Link href={ROUTES.admin.hrVacancies} className={buttonClass({ variant: 'outline', size: 'sm' })}>
            Offene Stellen
          </Link>
          <Link href="/admin/team/new" className={buttonClass({ variant: 'primary' })}>
            <UserPlus className="w-5 h-5" />
            Profil erstellen
          </Link>
        </div>
      }
    >
      {/* Staff without profiles — promoted to the top so adding a member
          is one click from this page. Each chip pre-fills the new-profile
          form with the user_id, skipping the "pick a user" step entirely. */}
      {staffWithoutProfiles.length > 0 && (
        <section
          aria-labelledby="staff-without-profile-title"
          className="rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20"
        >
          <h2
            id="staff-without-profile-title"
            className="font-mono text-xs uppercase tracking-[0.18em] text-warning-700 dark:text-warning-400"
          >
            {t('withoutProfileTitle', { count: staffWithoutProfiles.length })}
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {staffWithoutProfiles.slice(0, 8).map(user => (
              <Link
                key={user.id}
                href={`/admin/team/new?user_id=${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-surface-base px-3 py-1 text-xs font-medium text-warning-900 transition-colors hover:border-warning-400 hover:bg-warning-100 dark:border-warning-700 dark:bg-warning-950/40 dark:text-warning-200 dark:hover:bg-warning-900/40"
              >
                <UserPlus className="h-3 w-3" />
                {user.name || user.email}
              </Link>
            ))}
            {staffWithoutProfiles.length > 8 && (
              <span className="inline-flex items-center px-2 text-xs text-warning-700 dark:text-warning-400">
                {t('withoutProfileMore', { count: staffWithoutProfiles.length - 8 })}
              </span>
            )}
          </div>
        </section>
      )}

      {/* Stats */}
      <AdminStatsStrip
        items={[
          { icon: Briefcase, color: 'blue',   label: 'Staff Gesamt', value: stats.totalStaff },
          { icon: Crown,     color: 'purple', label: 'Profile',      value: stats.totalProfiles },
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
        ] satisfies StatItem[]}
      />

      {/* Permission Requests - Super Admin Only */}
      {currentUserIsSuperAdmin && <PermissionRequestsManager />}

      {/* Team List with Filters (Client Component) */}
      <TeamListClient />

      {/* Footer notice — sensitive data + auto-staff detection, collapsed
          to a single mono line so it stops competing with the list. */}
      <p className="border-t border-subtle pt-6 font-mono text-xs uppercase tracking-[0.14em] text-text-tertiary">
        {t('footerNotice', { domain: `@${ORG.emailDomain}` })}
      </p>
    </AdminPageWrapper>
  )
}
