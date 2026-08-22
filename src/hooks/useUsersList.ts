'use client'

import { useState, useCallback } from 'react'
import { useSwrFetch } from '@/lib/api/swr'
import { useDebounce } from '@/hooks/useDebounce'
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

const PAGE_LIMIT = 25

export function useUsersList() {
  const [filters, setFilters] = useState<UsersFilterState>({ search: '', type: 'all', verified: 'all' })
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(filters.search, 300)

  // Filters (search debounced) + page are encoded in the SWR key — any change
  // refetches automatically.
  const params = new URLSearchParams()
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (filters.type !== 'all') params.set('type', filters.type)
  if (filters.verified !== 'all') params.set('verified', filters.verified)
  params.set('page', page.toString())
  params.set('limit', PAGE_LIMIT.toString())

  const { data, error: loadError, isLoading: loading, mutate } = useSwrFetch<UsersApiData>(
    `/api/admin/users?${params.toString()}`,
  )

  const users = data?.items ?? []
  const error = loadError instanceof Error
    ? loadError.message || 'Fehler beim Laden der Benutzer'
    : null
  const pagination = {
    page,
    limit: PAGE_LIMIT,
    total: data?.pagination.total ?? 0,
    pages: data?.pagination.pages ?? 0,
  }

  const fetchUsers = useCallback(async () => {
    await mutate()
  }, [mutate])

  // Filter changes reset to the first page (previously an effect on the
  // debounced value; doing it in the handler avoids the extra render pass).
  const handleFilterChange = (field: keyof UsersFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
    setPage(1)
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetFilters = () => {
    setFilters({ search: '', type: 'all', verified: 'all' })
    setPage(1)
  }
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
