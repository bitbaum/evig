/**
 * Admin Team & HR Page - Server Component
 *
 * Shows staff members from the database.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection, isSuperAdmin } from '@/lib/permissions'
import { Users, UserPlus, Briefcase, Heart, Mail, Crown, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Team & HR | RevampIT Admin',
  description: 'Mitarbeiter und Team verwalten.',
}

interface StaffMember {
  id: string
  name: string | null
  email: string
  is_staff: boolean
  staff_permissions: string[] | null
  created_at: string
}

interface TeamStats {
  totalStaff: number
  superAdmins: number
  regularStaff: number
}

async function getTeamStats(): Promise<TeamStats> {
  try {
    const staffResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    const totalStaff = parseInt(staffResult.rows[0]?.count || '0')

    // Super admins are determined by the SUPER_ADMIN_EMAILS list, not DB
    // So we count them from the staff list
    const staffListResult = await query<{ email: string }>(
      `SELECT email FROM ${TABLE_NAMES.USERS} WHERE is_staff = true`
    )
    const superAdmins = staffListResult.rows.filter(r => isSuperAdmin(r.email)).length

    return {
      totalStaff,
      superAdmins,
      regularStaff: totalStaff - superAdmins,
    }
  } catch {
    return { totalStaff: 0, superAdmins: 0, regularStaff: 0 }
  }
}

async function getStaffMembers(): Promise<StaffMember[]> {
  try {
    const result = await query<StaffMember>(
      `SELECT
        id,
        name,
        email,
        is_staff,
        staff_permissions,
        created_at
       FROM ${TABLE_NAMES.USERS}
       WHERE is_staff = true OR email LIKE '%@revamp-it.ch'
       ORDER BY created_at DESC`
    )
    return result.rows
  } catch {
    return []
  }
}

export default async function TeamPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team')
  }

  // Check permission for sensitive team section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'team')

  if (!hasAccess) {
    redirect('/admin?error=no_team_access')
  }

  const [stats, staffMembers] = await Promise.all([
    getTeamStats(),
    getStaffMembers(),
  ])

  return (
    <div className="space-y-6">
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
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStaff}</p>
              <p className="text-gray-600 dark:text-gray-400">Gesamt Staff</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.superAdmins}</p>
              <p className="text-gray-600 dark:text-gray-400">Super Admins</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.regularStaff}</p>
              <p className="text-gray-600 dark:text-gray-400">Staff Mitglieder</p>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Team Mitglieder</h2>
        </div>

        {staffMembers.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {staffMembers.map(member => {
              const memberIsSuperAdmin = isSuperAdmin(member.email)
              const permissions = member.staff_permissions || []
              const hasFullAccess = permissions.includes('*')

              return (
                <div key={member.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      memberIsSuperAdmin
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                        : 'bg-gradient-to-r from-blue-500 to-green-600'
                    }`}>
                      <span className="text-white font-medium text-sm">
                        {member.name ? member.name.split(' ').map(n => n[0]).join('').substring(0, 2) : member.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {member.name || member.email.split('@')[0]}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {memberIsSuperAdmin ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        <Crown className="w-3 h-3" />
                        Super Admin
                      </span>
                    ) : hasFullAccess ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <Shield className="w-3 h-3" />
                        Voller Zugriff
                      </span>
                    ) : permissions.length > 0 ? (
                      <span className="text-sm text-gray-500">
                        {permissions.length} Bereiche
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Basis</span>
                    )}
                    <span className="text-xs text-gray-400">
                      Seit {new Date(member.created_at).toLocaleDateString('de-CH')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Staff-Mitglieder
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Noch keine Mitarbeiter mit @revamp-it.ch E-Mail registriert.
            </p>
          </div>
        )}
      </div>

      <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          <strong>Sensible Daten:</strong> Diese Seite enthält vertrauliche Team-Informationen und ist nur für autorisierte Mitarbeiter zugänglich.
        </p>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Benutzer mit @revamp-it.ch E-Mail-Adresse werden automatisch als Staff erkannt.
          Super Admin Status wird durch die Systemkonfiguration definiert.
        </p>
      </div>
    </div>
  )
}
