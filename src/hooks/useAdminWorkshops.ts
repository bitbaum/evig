'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { useSwrFetch } from '@/lib/api/swr'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { PROPOSAL_STATUS, type ProposalStatus } from '@/config/workshops'
import type { WorkshopProposalWithProposer } from '@/components/workshops/types'
import { PAGINATION } from '@/config/pagination'

const STRINGS = {
  APPROVE_ERROR: 'Fehler bei der Genehmigung',
  REJECT_ERROR: 'Fehler bei der Ablehnung',
  REJECT_REASON_REQUIRED: 'Bitte gib einen Ablehnungsgrund an.',
} as const

export interface WorkshopFilters {
  status: ProposalStatus | 'all'
  category: string
}

export function useAdminWorkshops() {
  const { status: sessionStatus } = useSession()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<WorkshopFilters>({
    status: PROPOSAL_STATUS.PENDING,
    category: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectError, setRejectError] = useState<string | null>(null)
  const [approveConfirmId, setApproveConfirmId] = useState<string | null>(null)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)

  // Build the SWR key from filter + pagination state. When any of these
  // change, SWR refetches automatically against the new key — no manual
  // useEffect-with-deps + AbortController dance needed. When the session
  // isn't authenticated yet, pass null so SWR skips the fetch entirely.
  const swrKey = (() => {
    if (sessionStatus !== 'authenticated') return null
    const params = new URLSearchParams({
      status: filters.status,
      limit: String(PAGINATION.DEFAULT),
      offset: String((currentPage - 1) * PAGINATION.DEFAULT),
    })
    if (filters.category !== 'all') params.set('category', filters.category)
    if (searchTerm.trim()) params.set('q', searchTerm.trim())
    return `/api/admin/workshops/proposals?${params}`
  })()

  const {
    data,
    error: swrError,
    isLoading,
    mutate,
  } = useSwrFetch<{
    items: WorkshopProposalWithProposer[]
    pagination?: { total: number }
  }>(swrKey)

  const proposals = data?.items ?? []
  const totalItems = data?.pagination?.total ?? 0

  // displayError priority: local action errors override SWR load errors.
  const displayError = error || (swrError ? ERROR_MESSAGES.WORKSHOP_PROPOSALS_LOAD_FAILED : '')

  const handleApprove = (proposalId: string) => {
    setApproveConfirmId(proposalId)
  }

  const doApprove = async () => {
    if (!approveConfirmId) return
    setApproveLoading(true)
    const result = await apiFetch<void>(`/api/admin/workshops/proposals/${approveConfirmId}/approve`, {
      method: 'POST',
      body: { action: 'approve', review_notes: 'Workshop genehmigt' },
    })
    setApproveLoading(false)
    if (result.success) {
      setApproveConfirmId(null)
      // Revalidate the SWR cache so the approved proposal disappears
      // from the pending list (or appears in the approved tab depending
      // on the current filter).
      await mutate()
    } else {
      setError(result.error || STRINGS.APPROVE_ERROR)
      setApproveConfirmId(null)
    }
  }

  const handleReject = async (proposalId: string) => {
    if (!rejectionReason.trim()) {
      setRejectError(STRINGS.REJECT_REASON_REQUIRED)
      return
    }
    setRejectError(null)
    setRejectLoading(true)
    const result = await apiFetch<void>(`/api/admin/workshops/proposals/${proposalId}/approve`, {
      method: 'POST',
      body: { action: 'reject', review_notes: rejectionReason },
    })
    setRejectLoading(false)
    if (result.success) {
      setRejectingId(null)
      setRejectionReason('')
      await mutate()
    } else {
      setError(result.error || STRINGS.REJECT_ERROR)
    }
  }

  const openRejectForm = (proposalId: string) => {
    setRejectingId(proposalId)
    setRejectionReason('')
    setRejectError(null)
  }

  const cancelReject = () => {
    setRejectingId(null)
    setRejectionReason('')
    setRejectError(null)
  }

  const totalPages = Math.ceil(totalItems / PAGINATION.DEFAULT)

  return {
    proposals,
    totalItems,
    totalPages,
    loading: isLoading,
    error: displayError,
    filters,
    searchTerm,
    currentPage,
    pageSize: PAGINATION.DEFAULT,
    rejectingId,
    rejectionReason,
    rejectError,
    approveConfirmId,
    approveLoading,
    rejectLoading,
    sessionStatus,
    setSearchTerm,
    setFilters,
    setCurrentPage,
    setRejectionReason,
    handleApprove,
    doApprove,
    handleReject,
    openRejectForm,
    cancelReject,
    setApproveConfirmId,
  }
}
