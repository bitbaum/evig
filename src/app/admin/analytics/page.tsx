/**
 * Admin Analytics Page - Server Component
 *
 * Shows real statistics from the database with user growth and activity overview.
 * No mock data - all values come from actual database queries.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import {
  BarChart3,
  Users,
  Calendar,
  Wrench,
  Package,
  TrendingUp,
  ArrowRight,
  ClipboardList,
  DollarSign,
} from 'lucide-react'

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

interface MonthlyGrowth {
  month: string
  count: number
}

interface ActivitySummary {
  taskCompletionsThisWeek: number
  taskCompletionsThisMonth: number
  contentSubmissionsThisMonth: number
  activeTasksCount: number
}

async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    const usersResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}`
    )
    const totalUsers = parseInt(usersResult.rows[0]?.count || '0')

    const usersThisMonthResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USERS}
       WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
    )
    const usersThisMonth = parseInt(usersThisMonthResult.rows[0]?.count || '0')

    let totalWorkshops = 0
    try {
      const workshopsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.WORKSHOPS}`
      )
      totalWorkshops = parseInt(workshopsResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    let totalTechnicians = 0
    try {
      const techResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.IT_HILFE_TECHNICIAN_PROFILES} WHERE is_active = true`
      )
      totalTechnicians = parseInt(techResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    let totalSellers = 0
    try {
      const sellerResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.SELLER_PROFILES} WHERE is_active = true`
      )
      totalSellers = parseInt(sellerResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    let pendingApprovals = 0
    try {
      const approvalsResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS} WHERE status = $1`,
        ['pending']
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
  } catch (error) {
    logger.error('Error fetching analytics stats', { error })
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

async function getUserGrowth(): Promise<MonthlyGrowth[]> {
  try {
    const result = await query<{ month: string; count: string }>(
      `SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        COUNT(*)::int as count
      FROM ${TABLE_NAMES.USERS}
      WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC`
    )
    return result.rows.map(r => ({ month: r.month, count: parseInt(r.count || '0') }))
  } catch (error) {
    logger.error('Error fetching user growth', { error })
    return []
  }
}

async function getActivitySummary(): Promise<ActivitySummary> {
  const defaults = {
    taskCompletionsThisWeek: 0,
    taskCompletionsThisMonth: 0,
    contentSubmissionsThisMonth: 0,
    activeTasksCount: 0,
  }

  try {
    let taskCompletionsThisWeek = 0
    let taskCompletionsThisMonth = 0
    let activeTasksCount = 0
    try {
      const tcResult = await query<{ week: string; month: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE completed_at >= CURRENT_DATE - INTERVAL '7 days')::int as week,
          COUNT(*) FILTER (WHERE completed_at >= DATE_TRUNC('month', CURRENT_DATE))::int as month
        FROM ${TABLE_NAMES.TASK_COMPLETIONS}`
      )
      taskCompletionsThisWeek = parseInt(tcResult.rows[0]?.week || '0')
      taskCompletionsThisMonth = parseInt(tcResult.rows[0]?.month || '0')

      const tasksResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.TASKS} WHERE NOT is_archived`
      )
      activeTasksCount = parseInt(tasksResult.rows[0]?.count || '0')
    } catch {
      // Tasks tables might not exist
    }

    let contentSubmissionsThisMonth = 0
    try {
      const csResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM ${TABLE_NAMES.USER_CONTENT_SUBMISSIONS}
         WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)`
      )
      contentSubmissionsThisMonth = parseInt(csResult.rows[0]?.count || '0')
    } catch {
      // Table might not exist
    }

    return {
      taskCompletionsThisWeek,
      taskCompletionsThisMonth,
      contentSubmissionsThisMonth,
      activeTasksCount,
    }
  } catch (error) {
    logger.error('Error fetching activity summary', { error })
    return defaults
  }
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januar', '02': 'Februar', '03': 'März', '04': 'April',
  '05': 'Mai', '06': 'Juni', '07': 'Juli', '08': 'August',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'Dezember',
}

function formatMonth(monthStr: string): string {
  const parts = monthStr.split('-')
  return `${MONTH_NAMES[parts[1]] || parts[1]} ${parts[0]}`
}

export default async function AnalyticsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/analytics')
  }

  const [stats, userGrowth, activity] = await Promise.all([
    getAnalyticsStats(),
    getUserGrowth(),
    getActivitySummary(),
  ])

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

      {/* Content Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Benutzer-Wachstum</h3>
          {userGrowth.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Keine Daten vorhanden</p>
          ) : (
            <div className="space-y-3">
              {userGrowth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{formatMonth(item.month)}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${Math.min(100, (item.count / Math.max(...userGrowth.map(g => g.count))) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">Registrierungen pro Monat (letzte 6 Monate)</p>
            </div>
          )}
        </div>

        {/* Activity Overview */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aktivitäts-Übersicht</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aufgaben erledigt (diese Woche)</span>
              </div>
              <span className="text-lg font-bold text-green-600">{activity.taskCompletionsThisWeek}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aufgaben erledigt (diesen Monat)</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{activity.taskCompletionsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Neue Einreichungen (diesen Monat)</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{activity.contentSubmissionsThisMonth}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Aktive Aufgaben</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{activity.activeTasksCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Links */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/admin/analyse/finanzen"
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Finanz-Analyse</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detaillierte Finanz-Statistiken und Diagramme</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/admin/tasks/analytics"
          className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Aufgaben-Analyse</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Beiträge, Kategorien und Verlauf</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
        </Link>
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
