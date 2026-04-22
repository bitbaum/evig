'use client'

/**
 * Activity Feed Component
 *
 * Main feed component that displays unified activity stream with filters
 */

import { useState } from 'react'
import { Plus, Filter, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import {
  ACTIVITY_SOURCE_LABELS,
  ACTIVITY_CATEGORY_OPTIONS,
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
  type ActivitySourceType,
} from '@/config/activity'
import { useActivityStream } from './useActivityStream'
import { ActivityCard } from './ActivityCard'
import { AddActivityModal } from './AddActivityModal'

interface TeamMemberOption {
  id: string
  name: string | null
  email: string
}

interface ActivityFeedProps {
  userId?: string
  showAddButton?: boolean
  showFilters?: boolean
  compact?: boolean
  teamMembers?: TeamMemberOption[]
}

export function ActivityFeed({
  userId,
  showAddButton = true,
  showFilters = true,
  compact = false,
  teamMembers = [],
}: ActivityFeedProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  const { activities, loading, error, total, filters, setFilters, refetch } = useActivityStream({
    user_id: userId,
    limit: compact ? 10 : 50,
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value || undefined, offset: 0 })
  }

  const clearFilters = () => {
    setFilters({
      source_type: undefined,
      category: undefined,
      user_id: undefined,
      since: undefined,
      until: undefined,
      offset: 0,
    })
  }

  const hasActiveFilters = filters.source_type || filters.category || filters.user_id || filters.since || filters.until

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heading level={2} className="text-lg text-gray-900 dark:text-gray-100">
            Aktivitäten
          </Heading>
          {!loading && (
            <span className="text-sm text-gray-500 dark:text-gray-400">({total})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg ${
                hasActiveFilters
                  ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Filter"
            >
              <Filter className="w-5 h-5" />
            </button>
          )}

          {showAddButton && (
            <Button
              onClick={() => setShowAddModal(true)}
              size="sm"
              variant="primary" className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Aktivität
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Source Type Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={filters.source_type || ''}
                onChange={(e) => handleFilterChange('source_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Alle Typen</option>
                {Object.entries(ACTIVITY_SOURCE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategorie
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
              >
                <option value="">Alle Kategorien</option>
                {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {ACTIVITY_CATEGORY_LABELS[cat as ActivityCategory]}
                  </option>
                ))}
              </select>
            </div>

            {/* Person Filter */}
            {teamMembers.length > 0 && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Person
                </label>
                <select
                  value={filters.user_id || ''}
                  onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="">Alle</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Filter zurücksetzen
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
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'Keine Aktivitäten mit diesen Filtern gefunden.'
              : 'Noch keine Aktivitäten vorhanden.'}
          </p>
          {showAddButton && !hasActiveFilters && (
            <Button
              onClick={() => setShowAddModal(true)}
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Erste Aktivität hinzufügen
            </Button>
          )}
        </div>
      )}

      {/* Activity List */}
      {!loading && !error && activities.length > 0 && (
        <div className="space-y-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}

      {/* Load More */}
      {!loading && !error && activities.length < total && !compact && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setFilters({ offset: filters.offset + filters.limit })}
            className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
          >
            Mehr laden
          </button>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddActivityModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
