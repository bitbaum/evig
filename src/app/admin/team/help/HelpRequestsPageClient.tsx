'use client'

/**
 * Help Requests Page Client Component
 *
 * Client-side rendering for help requests list with filters and actions
 */

import { useState } from 'react'
import { Plus, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  HELP_REQUEST_STATUS_OPTIONS,
  HELP_REQUEST_URGENCY_OPTIONS,
  HELP_REQUEST_STATUS_LABELS,
  HELP_REQUEST_URGENCY_LABELS,
  type HelpRequestStatus,
  type HelpRequestUrgency,
} from '@/config/activity'
import { HELP_REQUEST_STATUS } from '@/config/help-request-status'
import {
  useHelpRequests,
  useHelpRequestMutations,
  HelpRequestCard,
  CreateHelpRequestModal,
} from '@/components/admin/team/activity'

interface TeamMemberOption {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
}

interface HelpRequestsPageClientProps {
  teamMembers: TeamMemberOption[]
  currentUserEmail: string
}

export function HelpRequestsPageClient({
  teamMembers,
  currentUserEmail,
}: HelpRequestsPageClientProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const { requests, loading, error, total, filters, setFilters, refetch } = useHelpRequests({
    limit: 50,
  })

  const { resolveRequest, updateRequest } = useHelpRequestMutations()

  const handleResolve = async (id: string) => {
    setResolvingId(id)
    const success = await resolveRequest(id)
    if (success) {
      refetch()
    }
    setResolvingId(null)
  }

  const handleTakeOn = async (id: string) => {
    const success = await updateRequest(id, { status: HELP_REQUEST_STATUS.IN_PROGRESS })
    if (success) {
      refetch()
    }
  }

  const handleFilterChange = (key: string, value: string | boolean | undefined) => {
    setFilters({ [key]: value, offset: 0 })
  }

  const clearFilters = () => {
    setFilters({
      status: undefined,
      urgency: undefined,
      is_broadcast: undefined,
      offset: 0,
    })
  }

  const hasActiveFilters = filters.status || filters.urgency || filters.is_broadcast !== undefined

  // Separate requests by status
  const openRequests = requests.filter((r) => r.status === HELP_REQUEST_STATUS.OPEN)
  const inProgressRequests = requests.filter((r) => r.status === HELP_REQUEST_STATUS.IN_PROGRESS)
  const resolvedRequests = requests.filter((r) => r.status === HELP_REQUEST_STATUS.RESOLVED || r.status === HELP_REQUEST_STATUS.CANCELLED)

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg ${
              hasActiveFilters
                ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Filter"
          >
            <Filter className="w-5 h-5" />
          </button>

          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {total} Anfrage{total !== 1 ? 'n' : ''}
            </span>
          )}
        </div>

        <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Hilfe anfordern
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Alle Status</option>
                {HELP_REQUEST_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {HELP_REQUEST_STATUS_LABELS[status as HelpRequestStatus]}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dringlichkeit
              </label>
              <select
                value={filters.urgency || ''}
                onChange={(e) => handleFilterChange('urgency', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Alle</option>
                {HELP_REQUEST_URGENCY_OPTIONS.map((urg) => (
                  <option key={urg} value={urg}>
                    {HELP_REQUEST_URGENCY_LABELS[urg as HelpRequestUrgency]}
                  </option>
                ))}
              </select>
            </div>

            {/* Broadcast Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Empfänger
              </label>
              <select
                value={filters.is_broadcast === undefined ? '' : String(filters.is_broadcast)}
                onChange={(e) =>
                  handleFilterChange(
                    'is_broadcast',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Alle</option>
                <option value="true">An alle (Broadcast)</option>
                <option value="false">Gezielt</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Zurücksetzen
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Keine Hilfsanfragen mit diesen Filtern gefunden.'
              : 'Noch keine Hilfsanfragen vorhanden.'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Erste Anfrage erstellen
            </button>
          )}
        </div>
      )}

      {/* Requests List */}
      {!loading && !error && requests.length > 0 && !hasActiveFilters && (
        <div className="space-y-6">
          {/* Open Requests */}
          {openRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Offene Anfragen ({openRequests.length})
              </h3>
              <div className="space-y-4">
                {openRequests.map((request) => (
                  <HelpRequestCard
                    key={request.id}
                    request={request}
                    onResolve={handleResolve}
                    onTakeOn={handleTakeOn}
                    isResolving={resolvingId === request.id}
                    currentUserEmail={currentUserEmail}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress Requests */}
          {inProgressRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                In Bearbeitung ({inProgressRequests.length})
              </h3>
              <div className="space-y-4">
                {inProgressRequests.map((request) => (
                  <HelpRequestCard
                    key={request.id}
                    request={request}
                    onResolve={handleResolve}
                    isResolving={resolvingId === request.id}
                    currentUserEmail={currentUserEmail}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Resolved Requests */}
          {resolvedRequests.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                Abgeschlossen ({resolvedRequests.length})
              </h3>
              <div className="space-y-4">
                {resolvedRequests.map((request) => (
                  <HelpRequestCard
                    key={request.id}
                    request={request}
                    showActions={false}
                    currentUserEmail={currentUserEmail}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtered List (flat) */}
      {!loading && !error && requests.length > 0 && hasActiveFilters && (
        <div className="space-y-4">
          {requests.map((request) => (
            <HelpRequestCard
              key={request.id}
              request={request}
              onResolve={request.status !== HELP_REQUEST_STATUS.RESOLVED ? handleResolve : undefined}
              onTakeOn={request.status === HELP_REQUEST_STATUS.OPEN && request.is_broadcast ? handleTakeOn : undefined}
              isResolving={resolvingId === request.id}
              showActions={request.status !== HELP_REQUEST_STATUS.RESOLVED && request.status !== HELP_REQUEST_STATUS.CANCELLED}
              currentUserEmail={currentUserEmail}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateHelpRequestModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => refetch()}
          teamMembers={teamMembers}
        />
      )}
    </div>
  )
}
