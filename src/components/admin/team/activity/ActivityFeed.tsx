'use client'

/**
 * Activity Feed Component
 *
 * Main feed component that displays unified activity stream with filters
 */

import { useState } from 'react'
import { adminInteractive } from '@/lib/admin-ui'
import { Plus, Filter, RefreshCw, Loader2 } from 'lucide-react'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
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
          <Heading level={2} className="text-lg text-text-primary">
            Aktivitäten
          </Heading>
          {!loading && (
            <span className="text-sm text-text-tertiary">({total})</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => refetch()}
            disabled={loading}
            variant="ghost"
            size="icon"
            className="text-text-tertiary hover:text-text-secondary"
            title="Aktualisieren"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {showFilters && (
            <Button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              variant="ghost"
              size="icon"
              className={
                hasActiveFilters
                  ? 'text-action bg-action-muted'
                  : `text-text-tertiary hover:text-text-secondary ${adminInteractive.rowHover}`
              }
              title="Filter"
            >
              <Filter className="w-5 h-5" />
            </Button>
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
        <div className="bg-surface-base rounded-lg border border-subtle p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Source Type Filter */}
            <div className="flex-1">
              <FormField label="Typ">
                <Select
                  value={filters.source_type || ''}
                  onChange={(e) => handleFilterChange('source_type', e.target.value)}
                >
                  <option value="">Alle Typen</option>
                  {Object.entries(ACTIVITY_SOURCE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <FormField label="Kategorie">
                <Select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Alle Kategorien</option>
                  {ACTIVITY_CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat}>
                      {ACTIVITY_CATEGORY_LABELS[cat as ActivityCategory]}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>

            {/* Person Filter */}
            {teamMembers.length > 0 && (
              <div className="flex-1">
                <FormField label="Person">
                  <Select
                    value={filters.user_id || ''}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  >
                    <option value="">Alle</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name || member.email}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="ghost" size="sm">
                  Filter zurücksetzen
                </Button>
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
          {[...Array(compact ? 3 : 5)].map((_, i) => (
            <div
              key={i}
              className="bg-surface-base rounded-lg border border-subtle p-4 animate-pulse"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-surface-overlay rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-overlay rounded-sm w-1/3" />
                  <div className="h-4 bg-surface-overlay rounded-sm w-2/3" />
                  <div className="h-3 bg-surface-overlay rounded-sm w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && activities.length === 0 && (
        <div className="bg-surface-base rounded-lg border border-subtle p-8 text-center">
          <p className="text-text-tertiary mb-4">
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
          <Button
            onClick={() => setFilters({ offset: filters.offset + filters.limit })}
            variant="ghost"
            size="sm"
            className="text-action hover:bg-action-muted"
          >
            Mehr laden
          </Button>
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
