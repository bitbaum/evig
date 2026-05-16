/**
 * Admin Users Page - Server Component
 *
 * Shows all users with working search, filters, and pagination.
 * Uses new API with server-side filtering.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ORG } from '@/config/org'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { logger } from '@/lib/logger'
import {
  Users,
  Shield,
  UserCheck,
  Crown,
} from 'lucide-react'
import { UsersListClient } from './UsersListClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Benutzer verwalten',
  description: 'Benutzerkonten anzeigen und verwalten.',
}

interface UserStats {
  totalUsers: number
  activeUsers: number
  staffCount: number
  regularUsers: number
}

async function getUserStats(): Promise<UserStats> {
  try {
    const totalResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    const totalUsers = parseInt(totalResult.rows[0]?.count || '0')

    const verifiedResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE "emailVerified" IS NOT NULL`
    )
    const activeUsers = parseInt(verifiedResult.rows[0]?.count || '0')

    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    const staffCount = parseInt(staffResult.rows[0]?.count || '0')

    return {
      totalUsers,
      activeUsers,
      staffCount,
      regularUsers: totalUsers - staffCount,
    }
  } catch (error) {
    logger.error('Failed to fetch user stats', { error })
    return { totalUsers: 0, activeUsers: 0, staffCount: 0, regularUsers: 0 }
  }
}

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/users')
  }

  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'users')

  if (!hasAccess) {
    redirect('/admin?error=no_users_access')
  }

  const stats = await getUserStats()
  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  return (
    <AdminPageWrapper
      title="Benutzer verwalten"
      description="Benutzerkonten anzeigen und Berechtigungen verwalten"
      icon={Users}
      iconColor="blue"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Gesamt Benutzer</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Verifiziert</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Staff</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.staffCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 shadow-sm border border-neutral-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-neutral-600" />
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Benutzer</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.regularUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List with Client-side Filtering */}
      <UsersListClient currentUserIsSuperAdmin={currentUserIsSuperAdmin} />

      {/* Info Box */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-neutral-600" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-neutral-900 dark:text-neutral-200">
              Berechtigungssystem
            </Heading>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
              Benutzer mit @{ORG.emailDomain} E-Mail-Adressen werden automatisch als Staff erkannt.
              Super Admins haben vollen Zugriff und können anderen Staff-Mitgliedern Berechtigungen erteilen.
            </p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
