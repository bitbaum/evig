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
import Heading from '@/components/admin/AdminHeading'
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
        <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'week'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Diese Woche
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Dieser Monat
          </button>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-xl text-error-700 dark:text-error-300">
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
                className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-4 animate-pulse"
              >
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-16 mb-2" />
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6 animate-pulse">
            <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Digest Content */}
      {!loading && !error && digest && (
        <>
          {/* Period Info */}
          <div className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDateNumeric(digest.period.since)} - {formatDateNumeric(digest.period.until)}
            </span>
          </div>

          {/* Totals */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {digest.totals.task_completions}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Aufgaben erledigt</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {digest.totals.activity_updates}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Aktivitäten</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-warning-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {digest.totals.help_requests_created}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Hilfsanfragen</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {digest.totals.help_requests_resolved}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Gelöst</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-info-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-info-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {digest.totals.active_users}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">Aktive Mitarbeiter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors & Milestones */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Contributors */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-warning-500" />
                <Heading level={3} className="font-semibold text-neutral-900 dark:text-neutral-100">Top Beiträger</Heading>
              </div>

              {digest.top_contributors.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Noch keine Aktivitäten in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.top_contributors.slice(0, 5).map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-warning-100 text-warning-700'
                            : index === 1
                              ? 'bg-neutral-200 text-neutral-600'
                              : index === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {user.user_name || user.user_email.split('@')[0]}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {user.task_completions} Aufgaben, {user.help_requests_resolved} gelöst
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          {user.total_score}
                        </p>
                        <p className="text-xs text-neutral-500">Punkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Milestones */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-purple-500" />
                <Heading level={3} className="font-semibold text-neutral-900 dark:text-neutral-100">
                  Letzte Meilensteine
                </Heading>
              </div>

              {digest.recent_milestones.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Noch keine Meilensteine in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.recent_milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/[0.06]/50"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Flag className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100">
                          {milestone.title}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
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
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
              <Heading level={3} className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Aufgaben nach Kategorie
              </Heading>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {digest.by_category.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                  >
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                      {cat.count}
                    </p>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {TASK_CATEGORY_LABELS[cat.category as TaskCategory] || cat.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users Activity */}
          {digest.by_user.length > 0 && (
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-6">
              <Heading level={3} className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Alle Mitarbeiter
              </Heading>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/[0.06]">
                      <th className="text-left py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                        Name
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                        Aufgaben
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                        Aktivitäten
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                        Hilfsanfragen
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-neutral-600 dark:text-neutral-400">
                        Gelöst
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {digest.by_user.map((user) => (
                      <tr
                        key={user.user_id}
                        className="border-b border-neutral-100 dark:border-white/[0.06]/50 hover:bg-neutral-50 dark:hover:bg-white/[0.06]/30"
                      >
                        <td className="py-2 px-3">
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {user.user_name || user.user_email.split('@')[0]}
                          </span>
                          {user.department && (
                            <span className="ml-2 text-xs text-neutral-500 dark:text-neutral-400">
                              {user.department}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 px-3 text-neutral-900 dark:text-neutral-100">
                          {user.task_completions}
                        </td>
                        <td className="text-center py-2 px-3 text-neutral-900 dark:text-neutral-100">
                          {user.activity_updates}
                        </td>
                        <td className="text-center py-2 px-3 text-neutral-900 dark:text-neutral-100">
                          {user.help_requests_created}
                        </td>
                        <td className="text-center py-2 px-3 text-neutral-900 dark:text-neutral-100">
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
