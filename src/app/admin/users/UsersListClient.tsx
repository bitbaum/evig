'use client'

import { Users } from 'lucide-react'
import {
  UsersTableClient,
  UserFilters,
  Pagination,
} from '@/components/admin/users'
import { AdminListShell } from '@/components/admin/AdminListShell'
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
    <AdminListShell
      filters={
        <UserFilters
          search={filters.search}
          type={filters.type}
          verified={filters.verified}
          onSearchChange={(value) => handleFilterChange('search', value)}
          onTypeChange={(value) => handleFilterChange('type', value)}
          onVerifiedChange={(value) => handleFilterChange('verified', value)}
        />
      }
      loading={loading}
      error={error}
      onRetry={fetchUsers}
      isEmpty={users.length === 0}
      emptyIcon={Users}
      emptyTitle="Keine Benutzer gefunden"
      emptyDescription={
        hasActiveFilters
          ? 'Keine Benutzer entsprechen Ihren Filterkriterien.'
          : 'Keine Benutzer vorhanden.'
      }
      hasActiveFilters={hasActiveFilters}
      onResetFilters={resetFilters}
      resultsLabel={`${pagination.total} Benutzer gefunden`}
    >
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
    </AdminListShell>
  )
}
