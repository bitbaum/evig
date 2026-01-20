/**
 * Admin Users Page - Server Component
 *
 * Shows all users from the database with their staff status and permissions.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { canAccessSection, isSuperAdmin, isStaffEmail } from '@/lib/permissions'
import {
  Users,
  Eye,
  UserCheck,
  Crown,
  Shield,
  Edit,
  Mail,
  MapPin,
  Search,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Benutzer verwalten | RevampIT Admin',
  description: 'Benutzerkonten anzeigen und verwalten.',
}

interface UserRow {
  id: string
  name: string | null
  email: string
  is_staff: boolean
  staff_permissions: string[] | null
  created_at: string
  email_verified: string | null
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
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS} WHERE email_verified IS NOT NULL`
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
  } catch {
    return { totalUsers: 0, activeUsers: 0, staffCount: 0, regularUsers: 0 }
  }
}

async function getUsers(): Promise<UserRow[]> {
  try {
    const result = await query<UserRow>(
      `SELECT
        id,
        name,
        email,
        is_staff,
        staff_permissions,
        created_at,
        email_verified
       FROM ${TABLE_NAMES.USERS}
       ORDER BY
        is_staff DESC,
        created_at DESC
       LIMIT 100`
    )
    return result.rows
  } catch {
    return []
  }
}

export default async function AdminUsersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/users')
  }

  // Check permission for sensitive users section
  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'users')

  if (!hasAccess) {
    redirect('/admin?error=no_users_access')
  }

  const [stats, users] = await Promise.all([
    getUserStats(),
    getUsers(),
  ])

  const currentUserIsSuperAdmin = isSuperAdmin(session.user.email)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Benutzer verwalten
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Benutzerkonten anzeigen und Berechtigungen verwalten
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Benutzer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Verifiziert</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Staff</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.staffCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Benutzer</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.regularUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search (UI only for now) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Benutzer suchen..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Alle Typen</option>
              <option value="staff">Staff</option>
              <option value="regular">Benutzer</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Benutzer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Berechtigungen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Registriert
                </th>
                {currentUserIsSuperAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Aktionen
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => {
                const userIsSuperAdmin = isSuperAdmin(user.email)
                const userIsStaff = user.is_staff || isStaffEmail(user.email)
                const permissions = user.staff_permissions || []
                const hasFullAccess = permissions.includes('*')

                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            userIsSuperAdmin
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                              : userIsStaff
                                ? 'bg-gradient-to-r from-blue-500 to-green-600'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                          }`}>
                            <span className="text-white font-medium text-sm">
                              {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2) : user.email[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name || 'Kein Name'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {userIsSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                            <Crown className="w-3 h-3" />
                            Super Admin
                          </span>
                        )}
                        {userIsStaff && !userIsSuperAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                            <Shield className="w-3 h-3" />
                            Staff
                          </span>
                        )}
                        {!userIsStaff && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                            Benutzer
                          </span>
                        )}
                        {user.email_verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <UserCheck className="w-3 h-3" />
                            Verifiziert
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userIsStaff ? (
                        hasFullAccess ? (
                          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            Voller Zugriff
                          </span>
                        ) : permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {permissions.slice(0, 3).map(p => (
                              <span key={p} className="inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded">
                                {p}
                              </span>
                            ))}
                            {permissions.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{permissions.length - 3} mehr
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Keine Berechtigungen</span>
                        )
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {new Date(user.created_at).toLocaleDateString('de-CH')}
                      </div>
                    </td>
                    {currentUserIsSuperAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Details anzeigen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!userIsSuperAdmin && (
                            <button
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Berechtigungen bearbeiten"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Noch keine Benutzer
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Es wurden noch keine Benutzer registriert.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              Berechtigungssystem
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Benutzer mit @revamp-it.ch E-Mail-Adressen werden automatisch als Staff erkannt.
              Super Admins haben vollen Zugriff und können anderen Staff-Mitgliedern Berechtigungen erteilen.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
