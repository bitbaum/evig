'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'

const PAGE_SIZE = 20

export interface ITHilfeFilters {
  category: string
  canton: string
  urgency: string
  budgetType: string
}

const EMPTY_FILTERS: ITHilfeFilters = {
  category: '',
  canton: '',
  urgency: '',
  budgetType: '',
}

export function useITHilfeRequests() {
  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [offset, setOffset] = useState(0)
  const [filters, setFilters] = useState<ITHilfeFilters>(EMPTY_FILTERS)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.canton) params.set('canton', filters.canton)
      if (filters.urgency) params.set('urgency', filters.urgency)
      if (filters.budgetType) params.set('budgetType', filters.budgetType)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))

      const result = await apiFetch<{ requests: ITHilfeRequest[]; total: number }>(
        `/api/it-hilfe/requests?${params}`,
      )

      if (result.success && result.data) {
        setRequests(result.data.requests)
        setTotal(result.data.total)
      } else {
        logger.warn('Error fetching IT-Hilfe requests', { error: result.error })
        setError(result.error ?? 'Fehler beim Laden der Anfragen')
        setRequests([])
      }
    } finally {
      setLoading(false)
    }
  }, [filters, search, sort, offset])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  const setFilter = (key: keyof ITHilfeFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setOffset(0)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setSearch('')
    setSearchInput('')
    setSort('newest')
    setOffset(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const goToPage = (page: number) => setOffset((page - 1) * PAGE_SIZE)

  const hasActiveFilters = !!(
    filters.category || filters.canton || filters.urgency || filters.budgetType || search
  )

  return {
    requests,
    loading,
    total,
    error,
    searchInput,
    setSearchInput,
    sort,
    setSort: (s: string) => { setSort(s); setOffset(0) },
    filters,
    setFilter,
    handleSearch,
    clearFilters,
    hasActiveFilters,
    totalPages,
    currentPage,
    goToPage,
    retry: fetchRequests,
    limit: PAGE_SIZE,
  }
}
