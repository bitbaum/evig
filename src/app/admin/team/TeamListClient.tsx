'use client'

/**
 * Team List Client Component
 *
 * Handles filtering and display of team profiles.
 */

import { Users, RefreshCw } from 'lucide-react'
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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refetch}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
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
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && profiles.length === 0 && (
        <div className="p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Team-Profile gefunden
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.department || filters.employmentType
              ? 'Keine Profile entsprechen Ihren Filterkriterien.'
              : 'Erstellen Sie ein Profil, um loszulegen.'}
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
              className="text-blue-600 hover:text-blue-700 text-sm"
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profiles.length} {profiles.length === 1 ? 'Profil' : 'Profile'} gefunden
            </p>
            <button
              onClick={refetch}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
