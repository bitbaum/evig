'use client'

import { RefreshCw, Users } from 'lucide-react'
import {
  UsersTableClient,
  UserFilters,
  Pagination,
} from '@/components/admin/users'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
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
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              className="flex items-center gap-2 text-error-600 hover:text-error-700"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut versuchen
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-surface-base rounded-xl border border-subtle dark:border-white/6 p-8 text-center">
          <RefreshCw className="w-8 h-8 text-text-tertiary mx-auto animate-spin mb-4" />
          <p className="text-text-tertiary">Lade Benutzer...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-surface-base rounded-xl border border-subtle dark:border-white/6 p-12 text-center">
          <Users className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine Benutzer gefunden
          </Heading>
          <p className="text-text-tertiary mb-4">
            {hasActiveFilters
              ? 'Keine Benutzer entsprechen Ihren Filterkriterien.'
              : 'Keine Benutzer vorhanden.'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-action hover:text-action text-sm"
            >
              Filter zurücksetzen
            </Button>
          )}
        </div>
      )}

      {/* Results Info & Table */}
      {!loading && !error && users.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-tertiary">
              {pagination.total} Benutzer gefunden
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchUsers}
              className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-secondary"
            >
              <RefreshCw className="w-4 h-4" />
              Aktualisieren
            </Button>
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
