'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { PAGINATION } from '@/config/pagination'

export interface Technician {
  id: string
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  averageRating: number | null
  totalJobsCompleted: number
  /** Published-review count (denormalized on repairerProfiles). */
  totalReviews: number
  profileTier: string
  city: string | null
  postalCode: string | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  isVerified: boolean
  serviceDeliveryTypes: string[] | null
  skills: string[]
}

export interface TechnicianPagination {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

const PAGE_SIZE = PAGINATION.PUBLIC

export function useTechnicianList(loadingErrorMessage: string) {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [pagination, setPagination] = useState<TechnicianPagination>({
    total: 0,
    limit: PAGE_SIZE,
    offset: 0,
    hasMore: false,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [tier, setTier] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSkill, setSelectedSkill] = useState('')
  const [offset, setOffset] = useState(0)

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (tier) params.set('tier', tier)
      if (search) params.set('q', search)
      if (selectedSkill) params.set('skills', selectedSkill)
      params.set('limit', String(PAGE_SIZE))
      params.set('offset', String(offset))

      const result = await apiFetch<{ technicians: Technician[]; pagination: TechnicianPagination }>(
        `/api/technicians?${params}`,
      )

      if (result.success && result.data) {
        setTechnicians(result.data.technicians)
        setPagination(result.data.pagination)
      } else {
        logger.warn('Error fetching technicians', { error: result.error })
        setError(result.error || loadingErrorMessage)
        setTechnicians([])
      }
    } finally {
      setLoading(false)
    }
  }, [tier, search, selectedSkill, offset, loadingErrorMessage])

  useEffect(() => {
    fetchTechnicians()
  }, [fetchTechnicians])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  const setTierFilter = (value: string) => {
    setTier(value)
    setOffset(0)
  }

  const setSkillFilter = (value: string) => {
    setSelectedSkill(value)
    setOffset(0)
  }

  const clearFilters = () => {
    setSelectedSkill('')
    setSearch('')
    setSearchInput('')
    setTier('')
    setOffset(0)
  }

  const totalPages = Math.ceil(pagination.total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const goToPage = (page: number) => setOffset((page - 1) * PAGE_SIZE)
  const hasActiveFilters = !!(selectedSkill || search || tier)

  return {
    technicians,
    pagination,
    loading,
    error,
    tier,
    searchInput,
    setSearchInput,
    search,
    selectedSkill,
    limit: PAGE_SIZE,
    totalPages,
    currentPage,
    hasActiveFilters,
    handleSearch,
    setTierFilter,
    setSkillFilter,
    clearFilters,
    goToPage,
    retry: fetchTechnicians,
  }
}
