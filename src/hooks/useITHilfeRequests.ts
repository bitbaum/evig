'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'
import { PAGINATION } from '@/config/pagination'

export interface ITHilfeFilters {
  category: string
  canton: string
  urgency: string
  budgetType: string
  skill: string
  serviceType: string
  matchMySkills: boolean
}

const EMPTY_FILTERS: ITHilfeFilters = {
  category: '',
  canton: '',
  urgency: '',
  budgetType: '',
  skill: '',
  serviceType: '',
  matchMySkills: false,
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
      if (filters.skill) params.set('skill', filters.skill)
      if (filters.serviceType) params.set('serviceType', filters.serviceType)
      if (filters.matchMySkills) params.set('matchMySkills', 'true')
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      params.set('limit', String(PAGINATION.PUBLIC))
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

  const setFilter = (key: keyof ITHilfeFilters, value: string | boolean) => {
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

  const totalPages = Math.ceil(total / PAGINATION.PUBLIC)
  const currentPage = Math.floor(offset / PAGINATION.PUBLIC) + 1
  const goToPage = (page: number) => setOffset((page - 1) * PAGINATION.PUBLIC)

  const hasActiveFilters = !!(
    filters.category
    || filters.canton
    || filters.urgency
    || filters.budgetType
    || filters.skill
    || filters.serviceType
    || filters.matchMySkills
    || search
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
    limit: PAGINATION.PUBLIC,
  }
}
