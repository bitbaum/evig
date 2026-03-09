'use client'

/**
 * Digest Page Client Component
 *
 * Client-side rendering for the weekly digest
 */

import { useState } from 'react'
import { formatDateNumeric } from '@/lib/date-formats'
import {
  RefreshCw,
  Trophy,
  CheckCircle,
  FileText,
  HelpCircle,
  Users,
  Flag,
  Calendar,
} from 'lucide-react'
import { useDigest } from '@/components/admin/team/activity'
import { TASK_CATEGORY_LABELS, type TaskCategory } from '@/config/tasks'
import { formatRelativeTime } from '@/lib/utils'


export function DigestPageClient() {
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week')

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const since = dateRange === 'week' ? weekAgo.toISOString() : monthAgo.toISOString()
  const until = now.toISOString()

  const { digest, loading, error, refetch } = useDigest(since, until)

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'week'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Diese Woche
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Dieser Monat
          </button>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
              >
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Digest Content */}
      {!loading && !error && digest && (
        <>
          {/* Period Info */}
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDateNumeric(digest.period.since)} - {formatDateNumeric(digest.period.until)}
            </span>
          </div>

          {/* Totals */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {digest.totals.task_completions}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Aufgaben erledigt</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {digest.totals.activity_updates}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Aktivitäten</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {digest.totals.help_requests_created}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Hilfsanfragen</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {digest.totals.help_requests_resolved}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Gelöst</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {digest.totals.active_users}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Aktive Mitarbeiter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors & Milestones */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Contributors */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Top Beiträger</h3>
              </div>

              {digest.top_contributors.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Noch keine Aktivitäten in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.top_contributors.slice(0, 5).map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-700'
                            : index === 1
                              ? 'bg-gray-200 text-gray-600'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {user.user_name || user.user_email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.task_completions} Aufgaben, {user.help_requests_resolved} gelöst
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {user.total_score}
                        </p>
                        <p className="text-xs text-gray-500">Punkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Milestones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Letzte Meilensteine
                </h3>
              </div>

              {digest.recent_milestones.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Noch keine Meilensteine in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.recent_milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Flag className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {milestone.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {milestone.user_name || 'Unbekannt'} • {formatRelativeTime(milestone.occurred_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          {digest.by_category.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Aufgaben nach Kategorie
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {digest.by_category.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {cat.count}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {TASK_CATEGORY_LABELS[cat.category as TaskCategory] || cat.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users Activity */}
          {digest.by_user.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Alle Mitarbeiter
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                        Name
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                        Aufgaben
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                        Aktivitäten
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                        Hilfsanfragen
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                        Gelöst
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {digest.by_user.map((user) => (
                      <tr
                        key={user.user_id}
                        className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <td className="py-2 px-3">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {user.user_name || user.user_email.split('@')[0]}
                          </span>
                          {user.department && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              {user.department}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-900 dark:text-gray-100">
                          {user.task_completions}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-900 dark:text-gray-100">
                          {user.activity_updates}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-900 dark:text-gray-100">
                          {user.help_requests_created}
                        </td>
                        <td className="text-center py-2 px-3 text-gray-900 dark:text-gray-100">
                          {user.help_requests_resolved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
