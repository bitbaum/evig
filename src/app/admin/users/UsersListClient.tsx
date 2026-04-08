'use client'

/**
 * Users List Client Component
 *
 * Handles search, filtering, pagination, and displays the users table.
 */

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Users } from 'lucide-react'
import { isSuperAdmin } from '@/lib/permissions'
import {
  UsersTableClient,
  UserFilters,
  Pagination,
  type UserRow,
} from '@/components/admin/users'
import Heading from '@/components/ui/Heading'

interface UsersListClientProps {
  currentUserIsSuperAdmin: boolean
}

interface UsersApiResponse {
  success: boolean
  data?: {
    items: (UserRow & { is_super_admin_computed?: boolean })[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
    }
  }
  error?: string
}

interface FilterState {
  search: string
  type: string
  verified: string
}

export function UsersListClient({ currentUserIsSuperAdmin }: UsersListClientProps) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: 'all',
    verified: 'all',
  })

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  })

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search)
    }, 300)
    return () => clearTimeout(timer)
  }, [filters.search])

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.verified !== 'all') params.set('verified', filters.verified)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const result: UsersApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Fehler beim Laden der Benutzer')
      }

      if (result.data) {
        setUsers(result.data.items)
        setPagination(prev => ({
          ...prev,
          total: result.data!.pagination.total,
          pages: result.data!.pagination.pages,
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, filters.type, filters.verified, pagination.page, pagination.limit])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch, filters.type, filters.verified])

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchUsers}
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
          <RefreshCw className="w-8 h-8 text-gray-500 mx-auto animate-spin mb-4" />
          <p className="text-gray-500">Lade Benutzer...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Benutzer gefunden
          </Heading>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {filters.search || filters.type !== 'all' || filters.verified !== 'all'
              ? 'Keine Benutzer entsprechen Ihren Filterkriterien.'
              : 'Keine Benutzer vorhanden.'}
          </p>
          {(filters.search || filters.type !== 'all' || filters.verified !== 'all') && (
            <button
              onClick={() => setFilters({ search: '', type: 'all', verified: 'all' })}
              className="text-blue-600 hover:text-blue-700 text-sm"
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {pagination.total} {pagination.total === 1 ? 'Benutzer' : 'Benutzer'} gefunden
            </p>
            <button
              onClick={fetchUsers}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
