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
import { Button } from '@/components/ui/button'
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
        <div className="flex items-center gap-2 bg-surface-raised p-1 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'week'
                ? 'bg-surface-base text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Diese Woche
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              dateRange === 'month'
                ? 'bg-surface-base text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Dieser Monat
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={loading}
          className="p-2 text-text-tertiary hover:text-text-secondary hover:bg-surface-raised dark:hover:bg-surface-base/6 rounded-lg"
          title="Aktualisieren"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
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
                className="bg-surface-base rounded-lg border border-subtle p-4 animate-pulse"
              >
                <div className="h-8 bg-surface-overlay rounded-sm w-16 mb-2" />
                <div className="h-4 bg-surface-overlay rounded-sm w-24" />
              </div>
            ))}
          </div>
          <div className="bg-surface-base rounded-lg border border-subtle p-6 animate-pulse">
            <div className="h-6 bg-surface-overlay rounded-sm w-40 mb-4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-surface-overlay rounded-sm" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Digest Content */}
      {!loading && !error && digest && (
        <>
          {/* Period Info */}
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Calendar className="w-4 h-4" />
            <span>
              {formatDateNumeric(digest.period.since)} - {formatDateNumeric(digest.period.until)}
            </span>
          </div>

          {/* Totals */}
          <div className="grid md:grid-cols-5 gap-4">
            <div className="p-4 bg-surface-base rounded-lg border border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-action" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {digest.totals.task_completions}
                  </p>
                  <p className="text-xs text-text-secondary">Aufgaben erledigt</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-base rounded-lg border border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {digest.totals.activity_updates}
                  </p>
                  <p className="text-xs text-text-secondary">Aktivitäten</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-base rounded-lg border border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-warning-600 dark:text-warning-200" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {digest.totals.help_requests_created}
                  </p>
                  <p className="text-xs text-text-secondary">Hilfsanfragen</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-base rounded-lg border border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-action-muted rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-action" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {digest.totals.help_requests_resolved}
                  </p>
                  <p className="text-xs text-text-secondary">Gelöst</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-base rounded-lg border border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-surface-raised rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {digest.totals.active_users}
                  </p>
                  <p className="text-xs text-text-secondary">Aktive Mitarbeiter</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Contributors & Milestones */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Contributors */}
            <div className="bg-surface-base rounded-lg border border-subtle p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-warning-500" />
                <Heading level={3} className="font-semibold text-text-primary">Top Beiträger</Heading>
              </div>

              {digest.top_contributors.length === 0 ? (
                <p className="text-text-tertiary text-sm">
                  Noch keine Aktivitäten in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.top_contributors.slice(0, 5).map((user, index) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/[0.06]/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0
                            ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200'
                            : index === 1
                              ? 'bg-surface-overlay text-text-secondary'
                              : index === 2
                                ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300'
                                : 'bg-surface-raised text-text-tertiary'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary truncate">
                          {user.user_name || user.user_email.split('@')[0]}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {user.task_completions} Aufgaben, {user.help_requests_resolved} gelöst
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-text-primary">
                          {user.total_score}
                        </p>
                        <p className="text-xs text-text-tertiary">Punkte</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Milestones */}
            <div className="bg-surface-base rounded-lg border border-subtle p-6">
              <div className="flex items-center gap-2 mb-4">
                <Flag className="w-5 h-5 text-action" />
                <Heading level={3} className="font-semibold text-text-primary">
                  Letzte Meilensteine
                </Heading>
              </div>

              {digest.recent_milestones.length === 0 ? (
                <p className="text-text-tertiary text-sm">
                  Noch keine Meilensteine in diesem Zeitraum.
                </p>
              ) : (
                <div className="space-y-3">
                  {digest.recent_milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/[0.06]/50"
                    >
                      <div className="w-8 h-8 bg-action-muted rounded-lg flex items-center justify-center shrink-0">
                        <Flag className="w-4 h-4 text-action" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-primary">
                          {milestone.title}
                        </p>
                        <p className="text-xs text-text-tertiary">
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
            <div className="bg-surface-base rounded-lg border border-subtle p-6">
              <Heading level={3} className="font-semibold text-text-primary mb-4">
                Aufgaben nach Kategorie
              </Heading>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {digest.by_category.map((cat) => (
                  <div
                    key={cat.category}
                    className="p-3 bg-surface-raised rounded-lg"
                  >
                    <p className="text-2xl font-bold text-text-primary">
                      {cat.count}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {TASK_CATEGORY_LABELS[cat.category as TaskCategory] || cat.category}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Users Activity */}
          {digest.by_user.length > 0 && (
            <div className="bg-surface-base rounded-lg border border-subtle p-6">
              <Heading level={3} className="font-semibold text-text-primary mb-4">
                Alle Mitarbeiter
              </Heading>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border">
                      <th className="text-left py-2 px-3 font-medium text-text-secondary">
                        Name
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Aufgaben
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Aktivitäten
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Hilfsanfragen
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-text-secondary">
                        Gelöst
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {digest.by_user.map((user) => (
                      <tr
                        key={user.user_id}
                        className="border-b border-subtle dark:border-white/[0.06]/50 hover:bg-surface-raised dark:hover:bg-surface-base/[0.06]/30"
                      >
                        <td className="py-2 px-3">
                          <span className="font-medium text-text-primary">
                            {user.user_name || user.user_email.split('@')[0]}
                          </span>
                          {user.department && (
                            <span className="ml-2 text-xs text-text-tertiary">
                              {user.department}
                            </span>
                          )}
                        </td>
                        <td className="text-center py-2 px-3 text-text-primary">
                          {user.task_completions}
                        </td>
                        <td className="text-center py-2 px-3 text-text-primary">
                          {user.activity_updates}
                        </td>
                        <td className="text-center py-2 px-3 text-text-primary">
                          {user.help_requests_created}
                        </td>
                        <td className="text-center py-2 px-3 text-text-primary">
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
