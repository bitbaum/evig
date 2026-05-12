'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { UserRow } from '@/components/admin/users'

interface UsersApiData {
  items: (UserRow & { is_super_admin_computed?: boolean })[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface UsersFilterState {
  search: string
  type: string
  verified: string
}

export function useUsersList() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<UsersFilterState>({ search: '', type: 'all', verified: 'all' })
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300)
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
      const result = await apiFetch<UsersApiData>(`/api/admin/users?${params.toString()}`)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Fehler beim Laden der Benutzer')
      }
      setUsers(result.data.items)
      setPagination(prev => ({
        ...prev,
        total: result.data!.pagination.total,
        pages: result.data!.pagination.pages,
      }))
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

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [debouncedSearch, filters.type, filters.verified])

  const handleFilterChange = (field: keyof UsersFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetFilters = () => setFilters({ search: '', type: 'all', verified: 'all' })
  const hasActiveFilters = filters.search !== '' || filters.type !== 'all' || filters.verified !== 'all'

  return {
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
  }
}
