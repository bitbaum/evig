/**
 * Admin Users Page - Server Component
 *
 * Shows all users with working search, filters, and pagination.
 * Uses new API with server-side filtering.
 */

import { Metadata } from 'next'
import { ORG } from '@/config/org'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import { requireSection } from '@/lib/admin/guards'
import { logger } from '@/lib/logger'
import {
  Users,
  Shield,
  UserCheck,
  Crown,
} from 'lucide-react'
import { UsersListClient } from './UsersListClient'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { AdminStatsGrid, type StatCardItem } from '@/components/admin/AdminStatsGrid'
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
  const session = await requireSection('users')
  const stats = await getUserStats()
  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  return (
    <AdminPageWrapper
      title="Benutzer verwalten"
      description="Benutzerkonten anzeigen und Berechtigungen verwalten"
      icon={Users}
      iconColor="blue"
    >
      <AdminStatsGrid
        items={[
          { icon: Users,     color: 'blue',   label: 'Gesamt Benutzer', value: stats.totalUsers },
          { icon: UserCheck, color: 'green',  label: 'Verifiziert',     value: stats.activeUsers },
          { icon: Crown,     color: 'purple', label: 'Staff',           value: stats.staffCount },
          { icon: Users,     color: 'gray',   label: 'Benutzer',        value: stats.regularUsers },
        ] satisfies StatCardItem[]}
      />

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
