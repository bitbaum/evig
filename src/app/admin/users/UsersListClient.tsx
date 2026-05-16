'use client'

import { RefreshCw, Users } from 'lucide-react'
import {
  UsersTableClient,
  UserFilters,
  Pagination,
} from '@/components/admin/users'
import Heading from '@/components/admin/AdminHeading'
import { useUsersList } from '@/hooks/useUsersList'

interface UsersListClientProps {
  currentUserIsSuperAdmin: boolean
}

export function UsersListClient({ currentUserIsSuperAdmin }: UsersListClientProps) {
  const {
    users,
    loading,
    error,
    filters,
    pagination,
    fetchUsers,
    handleFilterChange,
    handlePageChange,
    resetFilters,
    hasActiveFilters,
  } = useUsersList()

  return (
    <div className="space-y-6">
      {/* Filters */}
      <UserFilters
        search={filters.search}
        type={filters.type}
        verified={filters.verified}
        onSearchChange={(value) => handleFilterChange('search', value)}
        onTypeChange={(value) => handleFilterChange('type', value)}
        onVerifiedChange={(value) => handleFilterChange('verified', value)}
      />

      {/* Error State */}
      {error && (
        <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-error-700 dark:text-error-300">{error}</p>
            <button
              onClick={fetchUsers}
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
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-white/[0.06] p-8 text-center">
          <RefreshCw className="w-8 h-8 text-neutral-500 mx-auto animate-spin mb-4" />
          <p className="text-neutral-500">Lade Benutzer...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-white/[0.06] p-12 text-center">
          <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Keine Benutzer gefunden
          </Heading>
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">
            {hasActiveFilters
              ? 'Keine Benutzer entsprechen Ihren Filterkriterien.'
              : 'Keine Benutzer vorhanden.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Results Info & Table */}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {pagination.total} Benutzer gefunden
            </p>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </button>
          </div>

          <UsersTableClient
            users={users}
            currentUserIsSuperAdmin={currentUserIsSuperAdmin}
          />

          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  )
}
