/**
 * Admin Analytics Page - Server Component
 *
 * Shows real statistics from the database.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { BarChart3, Users, Calendar, Wrench, Package, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Analytics | RevampIT Admin',
  description: 'Statistiken und Auswertungen.',
}

interface AnalyticsStats {
  totalUsers: number
  usersThisMonth: number
  totalWorkshops: number
  totalTechnicians: number
  totalSellers: number
  pendingApprovals: number
}

async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    // Get total users
    const usersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    const totalUsers = parseInt(usersResult.rows[0]?.count || '0')

    // Get users registered this month
    const usersThisMonthResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    )
    const usersThisMonth = parseInt(usersThisMonthResult.rows[0]?.count || '0')

    // Get total workshops
    let totalWorkshops = 0
    try {
      const workshopsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOPS}`
      )
      totalWorkshops = parseInt(workshopsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    // Get technician count
    let totalTechnicians = 0
    try {
      const techResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.TECHNICIAN_PROFILES} WHERE is_active = true`
      )
      totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    // Get seller count
    let totalSellers = 0
    try {
      const sellerResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SELLER_PROFILES} WHERE is_active = true`
      )
      totalSellers = parseInt(sellerResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    // Get pending approvals
    let pendingApprovals = 0
    try {
      const approvalsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE status = 'pending'`
      )
      pendingApprovals = parseInt(approvalsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    return {
      totalUsers,
      usersThisMonth,
      totalWorkshops,
      totalTechnicians,
      totalSellers,
      pendingApprovals,
    }
  } catch {
    return {
      totalUsers: 0,
      usersThisMonth: 0,
      totalWorkshops: 0,
      totalTechnicians: 0,
      totalSellers: 0,
      pendingApprovals: 0,
    }
  }
}

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analytics')
  }

  const stats = await getAnalyticsStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Statistiken und Auswertungen für RevampIT
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Benutzer</p>
            </div>
          </div>
          {stats.usersThisMonth > 0 && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +{stats.usersThisMonth} diesen Monat
            </p>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWorkshops}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Workshops</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Wrench className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTechnicians}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Techniker</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSellers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Verkäufer</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 col-span-2">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingApprovals}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ausstehende Freigaben</p>
            </div>
          </div>
          {stats.pendingApprovals > 0 && (
            <Link
              href="/admin/approvals"
              className="text-xs text-blue-600 hover:underline mt-2 inline-block"
            >
              Freigaben anzeigen →
            </Link>
          )}
        </div>
      </div>

      {/* Placeholder Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Benutzer-Wachstum</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Diagramme werden in einer zukünftigen Version hinzugefügt
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aktivitäts-Übersicht</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Diagramme werden in einer zukünftigen Version hinzugefügt
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Hinweis:</strong> Die Statistiken werden in Echtzeit aus der Datenbank berechnet.
          Für detaillierte Finanz-Analytics, siehe{' '}
          <Link href="/admin/hirn/finanzen" className="underline hover:text-blue-800">
            Hirn Finanzen
          </Link>.
        </p>
      </div>
    </div>
  )
}
