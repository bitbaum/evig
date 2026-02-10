/**
 * Task Analytics Page - Server Component
 *
 * Shows task completion statistics, contributions per person, and fairness metrics.
 * Created: 2026-02-05
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { query } from '@/lib/auth/db'
import { formatDateTimeNumeric } from '@/lib/date-formats'
import { TABLE_NAMES } from '@/config/database'
import {
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from '@/config/tasks'
import {
  ArrowLeft,
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Aufgaben Analyse | RevampIT Admin',
  description: 'Statistiken und Auswertungen zu Teamaufgaben.',
}

interface OverallStats {
  total_tasks: number
  total_completions: number
  completions_today: number
  completions_this_week: number
  completions_this_month: number
  avg_completion_time: number | null
}

interface ContributorStats {
  user_id: string
  user_name: string | null
  user_email: string
  completion_count: number
  total_duration_minutes: number | null
}

interface CategoryStats {
  category: TaskCategory
  completion_count: number
}

interface RecentCompletion {
  id: string
  task_title: string
  completed_by_name: string | null
  completed_at: string
  duration_minutes: number | null
}

async function getOverallStats(): Promise<OverallStats> {
  const result = await query<OverallStats>(
    `SELECT
      (SELECT COUNT(*) FROM ${TABLE_NAMES.TASKS} WHERE is_archived = false)::int as total_tasks,
      COUNT(*)::int as total_completions,
      COUNT(*) FILTER (WHERE tc.completed_at >= CURRENT_DATE)::int as completions_today,
      COUNT(*) FILTER (WHERE tc.completed_at >= CURRENT_DATE - INTERVAL '7 days')::int as completions_this_week,
      COUNT(*) FILTER (WHERE tc.completed_at >= CURRENT_DATE - INTERVAL '30 days')::int as completions_this_month,
      ROUND(AVG(tc.duration_minutes))::int as avg_completion_time
    FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc`,
    []
  )
  return result.rows[0]
}

async function getContributorStats(days: number = 30): Promise<ContributorStats[]> {
  const result = await query<ContributorStats>(
    `SELECT
      tc.completed_by as user_id,
      u.name as user_name,
      u.email as user_email,
      COUNT(*)::int as completion_count,
      SUM(tc.duration_minutes)::int as total_duration_minutes
    FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
    JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
    WHERE tc.completed_at >= CURRENT_DATE - INTERVAL '1 day' * $1
    GROUP BY tc.completed_by, u.name, u.email
    ORDER BY completion_count DESC
    LIMIT 20`,
    [days]
  )
  return result.rows
}

async function getCategoryStats(days: number = 30): Promise<CategoryStats[]> {
  const result = await query<CategoryStats>(
    `SELECT
      t.category,
      COUNT(*)::int as completion_count
    FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
    JOIN ${TABLE_NAMES.TASKS} t ON tc.task_id = t.id
    WHERE tc.completed_at >= CURRENT_DATE - INTERVAL '1 day' * $1
    GROUP BY t.category
    ORDER BY completion_count DESC`,
    [days]
  )
  return result.rows
}

async function getRecentCompletions(): Promise<RecentCompletion[]> {
  const result = await query<RecentCompletion>(
    `SELECT
      tc.id,
      t.title as task_title,
      u.name as completed_by_name,
      tc.completed_at,
      tc.duration_minutes
    FROM ${TABLE_NAMES.TASK_COMPLETIONS} tc
    JOIN ${TABLE_NAMES.TASKS} t ON tc.task_id = t.id
    JOIN ${TABLE_NAMES.USERS} u ON tc.completed_by = u.id
    ORDER BY tc.completed_at DESC
    LIMIT 10`,
    []
  )
  return result.rows
}


function getProgressBarColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-yellow-500',
  ]
  return colors[index % colors.length]
}

export default async function TaskAnalyticsPage() {
  const [stats, contributors, categories, recentCompletions] = await Promise.all([
    getOverallStats(),
    getContributorStats(30),
    getCategoryStats(30),
    getRecentCompletions(),
  ])

  const maxContributions = contributors.length > 0
    ? Math.max(...contributors.map(c => c.completion_count))
    : 1

  const maxCategoryCount = categories.length > 0
    ? Math.max(...categories.map(c => c.completion_count))
    : 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/tasks"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Zurück
        </Link>
        <div className="w-px h-6 bg-gray-300" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufgaben Analyse</h1>
            <p className="text-gray-600">Statistiken und Auswertungen</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total_tasks}</p>
              <p className="text-sm text-gray-500">Aufgaben gesamt</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completions_today}</p>
              <p className="text-sm text-gray-500">Heute erledigt</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completions_this_week}</p>
              <p className="text-sm text-gray-500">Diese Woche</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completions_this_month}</p>
              <p className="text-sm text-gray-500">Diesen Monat</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avg_completion_time ? `${stats.avg_completion_time}m` : '-'}
              </p>
              <p className="text-sm text-gray-500">Ø Dauer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Contributor Stats */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Beiträge pro Person (letzte 30 Tage)
          </h2>
          {contributors.length === 0 ? (
            <p className="text-gray-500">Keine Daten vorhanden</p>
          ) : (
            <div className="space-y-3">
              {contributors.map((contributor, index) => (
                <div key={contributor.user_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">
                      {contributor.user_name || contributor.user_email}
                    </span>
                    <span className="text-gray-500">
                      {contributor.completion_count} Erledigungen
                      {contributor.total_duration_minutes && (
                        <span className="ml-2">
                          ({contributor.total_duration_minutes}m)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(index)}`}
                      style={{
                        width: `${(contributor.completion_count / maxContributions) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Stats */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Erledigungen pro Kategorie (letzte 30 Tage)
          </h2>
          {categories.length === 0 ? (
            <p className="text-gray-500">Keine Daten vorhanden</p>
          ) : (
            <div className="space-y-3">
              {categories.map((cat, index) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">
                      {TASK_CATEGORY_LABELS[cat.category] || cat.category}
                    </span>
                    <span className="text-gray-500">{cat.completion_count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getProgressBarColor(index)}`}
                      style={{
                        width: `${(cat.completion_count / maxCategoryCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Letzte Erledigungen
        </h2>
        {recentCompletions.length === 0 ? (
          <p className="text-gray-500">Noch keine Erledigungen</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Aufgabe
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Erledigt von
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Zeitpunkt
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Dauer
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCompletions.map((completion) => (
                  <tr key={completion.id} className="border-b last:border-0">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {completion.task_title}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {completion.completed_by_name || 'Unbekannt'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDateTimeNumeric(completion.completed_at)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">
                      {completion.duration_minutes
                        ? `${completion.duration_minutes}m`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
