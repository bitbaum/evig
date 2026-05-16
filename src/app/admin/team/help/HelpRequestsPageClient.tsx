'use client'

/**
 * Help Requests Page Client Component
 *
 * Client-side rendering for help requests list with filters and actions
 */

import { useState } from 'react'
import { Plus, Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
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
import Heading from '@/components/admin/AdminHeading'

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
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg ${
              hasActiveFilters
                ? 'text-info-600 bg-info-50 dark:bg-info-900/30'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]'
            }`}
            title="Filter"
          >
            <Filter className="w-5 h-5" />
          </button>

          {!loading && (
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {total} Anfrage{total !== 1 ? 'n' : ''}
            </span>
          )}
        </div>

        <Button onClick={() => setShowCreateModal(true)} size="sm" variant="primary" className="gap-2">
          <Plus className="w-4 h-4" />
          Hilfe anfordern
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Status Filter */}
            <FormField label="Status" className="flex-1">
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              >
                <option value="">Alle Status</option>
                {HELP_REQUEST_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {HELP_REQUEST_STATUS_LABELS[status as HelpRequestStatus]}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Urgency Filter */}
            <FormField label="Dringlichkeit" className="flex-1">
              <Select
                value={filters.urgency || ''}
                onChange={(e) => handleFilterChange('urgency', e.target.value || undefined)}
              >
                <option value="">Alle</option>
                {HELP_REQUEST_URGENCY_OPTIONS.map((urg) => (
                  <option key={urg} value={urg}>
                    {HELP_REQUEST_URGENCY_LABELS[urg as HelpRequestUrgency]}
                  </option>
                ))}
              </Select>
            </FormField>

            {/* Broadcast Filter */}
            <FormField label="Empfänger" className="flex-1">
              <Select
                value={filters.is_broadcast === undefined ? '' : String(filters.is_broadcast)}
                onChange={(e) =>
                  handleFilterChange(
                    'is_broadcast',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
              >
                <option value="">Alle</option>
                <option value="true">An alle (Broadcast)</option>
                <option value="false">Gezielt</option>
              </Select>
            </FormField>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06] rounded-lg"
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
        <div className="p-4 bg-error-50 dark:bg-error-900/30 border border-error-200 dark:border-error-800 rounded-xl text-error-700 dark:text-error-300">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                  <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-8 text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {hasActiveFilters
              ? 'Keine Hilfsanfragen mit diesen Filtern gefunden.'
              : 'Noch keine Hilfsanfragen vorhanden.'}
          </p>
          {!hasActiveFilters && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg inline-flex items-center gap-2"
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
              <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Offene Anfragen ({openRequests.length})
              </Heading>
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
              <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                In Bearbeitung ({inProgressRequests.length})
              </Heading>
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
              <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                Abgeschlossen ({resolvedRequests.length})
              </Heading>
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
