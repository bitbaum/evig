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
        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Gesamt Benutzer</p>
              <p className="text-2xl font-bold text-text-primary">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Verifiziert</p>
              <p className="text-2xl font-bold text-text-primary">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-action" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Staff</p>
              <p className="text-2xl font-bold text-text-primary">{stats.staffCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-base rounded-xl p-6 shadow-xs border border-subtle dark:border-white/6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-text-secondary" />
            <div>
              <p className="text-sm font-medium text-text-secondary">Benutzer</p>
              <p className="text-2xl font-bold text-text-primary">{stats.regularUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Users List with Client-side Filtering */}
      <UsersListClient currentUserIsSuperAdmin={currentUserIsSuperAdmin} />

      {/* Info Box */}
      <div className="bg-surface-raised border border rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-text-secondary" />
          </div>
          <div>
            <Heading level={3} className="font-medium text-text-primary">
              Berechtigungssystem
            </Heading>
            <p className="text-sm text-text-secondary mt-1">
              Benutzer mit @{ORG.emailDomain} E-Mail-Adressen werden automatisch als Staff erkannt.
              Super Admins haben vollen Zugriff und können anderen Staff-Mitgliedern Berechtigungen erteilen.
            </p>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  )
}
