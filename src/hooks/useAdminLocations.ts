'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { ADMIN_CONTENT } from '@/config/admin-content'
import { PAGINATION } from '@/config/pagination'

export interface Location {
  id: string
  name: string
  type: string
  city: string
  canton: string
  approvalStatus: string
  maxCapacity: number | null
  usageCount: number
  createdAt: string
  createdBy: string
}

export interface LocationFilters {
  status: string
  type: string
  city: string
}

const PAGE_SIZE = PAGINATION.PUBLIC

export function useAdminLocations() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()

  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalItems, setTotalItems] = useState(0)
  const [searchName, setSearchName] = useState('')
  const [filters, setFilters] = useState<LocationFilters>({ status: 'all', type: 'all', city: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmTarget, setConfirmTarget] = useState<{
    id: string
    action: 'approve' | 'reject'
    name: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const totalPages = Math.ceil(totalItems / PAGE_SIZE)

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (sessionStatus !== 'authenticated') return

    let cancelled = false
    async function load() {
      setLoading(true)
      const params = new URLSearchParams({
        status: filters.status,
        limit: String(PAGE_SIZE),
        offset: String((currentPage - 1) * PAGE_SIZE),
      })
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.city) params.set('city', filters.city)

      const result = await apiFetch<{ locations: Location[]; pagination?: { total: number } }>(
        `/api/locations?${params}`
      )
      if (cancelled) return
      setLoading(false)
      if (result.success && result.data) {
        setLocations(result.data.locations ?? [])
        setTotalItems(result.data.pagination?.total ?? 0)
      } else {
        setError(result.error || ADMIN_CONTENT.locations.errorMessage)
      }
    }

    load()
    return () => { cancelled = true }
  }, [sessionStatus, router, filters.status, filters.type, filters.city, currentPage])

  const doApproval = async () => {
    if (!confirmTarget) return
    setActionLoading(true)
    const result = await apiFetch<void>(`/api/locations/${confirmTarget.id}/approve`, {
      method: 'POST',
      body: {
        action: confirmTarget.action,
        review_notes: confirmTarget.action === 'reject' ? 'Administrative Prüfung' : 'Ort genehmigt',
      },
    })
    setActionLoading(false)
    if (result.success) {
      setConfirmTarget(null)
      setFilters(prev => ({ ...prev }))
    } else {
      setError(result.error || 'Fehler bei der Genehmigung')
      setConfirmTarget(null)
    }
  }

  const filteredLocations = searchName.trim()
    ? locations.filter(
        l =>
          l.name.toLowerCase().includes(searchName.toLowerCase()) ||
          l.city.toLowerCase().includes(searchName.toLowerCase())
      )
    : locations

  return {
    session,
    sessionStatus,
    locations,
    filteredLocations,
    loading,
    error,
    totalItems,
    totalPages,
    searchName,
    filters,
    currentPage,
    confirmTarget,
    actionLoading,
    pageSize: PAGE_SIZE,
    setSearchName,
    setFilters,
    setCurrentPage,
    setConfirmTarget,
    doApproval,
  }
}
