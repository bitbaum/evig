'use client'

/**
 * Team List Client Component
 *
 * Handles filtering and display of team profiles.
 */

import { Users, RefreshCw } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  TeamFilters,
  TeamMemberCard,
  useTeamProfiles,
} from '@/components/admin/team'

export function TeamListClient() {
  const {
    profiles,
    loading,
    error,
    filters,
    setFilters,
    refetch,
  } = useTeamProfiles()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <TeamFilters
        department={filters.department}
        employmentType={filters.employmentType}
        isActive={filters.isActive}
        search={filters.search}
        onDepartmentChange={(value) => setFilters({ department: value })}
        onEmploymentTypeChange={(value) => setFilters({ employmentType: value })}
        onIsActiveChange={(value) => setFilters({ isActive: value })}
        onSearchChange={(value) => setFilters({ search: value })}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-error-700 dark:text-error-300">{error}</p>
            <button
              onClick={refetch}
              className="flex items-center gap-2 text-error-600 hover:text-error-700"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-surface-base rounded-xl border border p-5 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-neutral-200 rounded-sm w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded-sm w-1/2" />
                  <div className="h-3 bg-neutral-200 rounded-sm w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-subtle dark:border-white/6">
                <div className="flex gap-2">
                  <div className="h-8 bg-neutral-200 rounded-sm flex-1" />
                  <div className="h-8 bg-neutral-200 rounded-sm flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && profiles.length === 0 && (
        <div className="p-12 bg-surface-base rounded-xl border border text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine Team-Profile gefunden
          </Heading>
          <p className="text-text-tertiary mb-4">
            {filters.search || filters.department || filters.employmentType
              ? 'Keine Profile entsprechen Ihren Filterkriterien.'
              : 'Erstelle ein Profil, um loszulegen.'}
          </p>
          {(filters.search || filters.department || filters.employmentType) && (
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  department: '',
                  employmentType: '',
                  isActive: 'all',
                })
              }
              className="text-action hover:text-action text-sm"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Team Grid */}
      {!loading && !error && profiles.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-tertiary">
              {profiles.length} {profiles.length === 1 ? 'Profil' : 'Profile'} gefunden
            </p>
            <button
              onClick={refetch}
              className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <TeamMemberCard
                key={profile.id}
                member={{
                  id: profile.id,
                  user_id: profile.user_id,
                  user_name: profile.user_name,
                  user_email: profile.user_email,
                  position: profile.position,
                  department: profile.department,
                  employment_type: profile.employment_type,
                  start_date: profile.start_date,
                  skills: profile.skills || [],
                  is_active: profile.is_active,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
