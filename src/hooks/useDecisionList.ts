'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { DecisionStatus, DecisionType, VotingMethod } from '@/config/decisions'
import { PAGINATION } from '@/config/pagination'

export interface DecisionListItem {
  id: string
  title: string
  decisionType: DecisionType
  votingMethod: VotingMethod
  status: DecisionStatus
  votingDeadline: string | null
  discussionDeadline: string | null
  voteCount: number
  commentCount: number
  hasUserVoted: boolean
  creator: { id: string; email: string }
  createdAt: string
}

const PAGE_SIZE = PAGINATION.PUBLIC

export function useDecisionList() {
  const [decisions, setDecisions] = useState<DecisionListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [reloadToken, setReloadToken] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<DecisionListItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('decisionType', typeFilter)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))

      try {
        const result = await apiFetch<{ decisions: DecisionListItem[]; total: number }>(
          `/api/decisions?${params.toString()}`
        )
        if (cancelled) return
        if (!result.success || !result.data) {
          setDecisions([])
          setTotal(0)
          setErrorMessage(result.error || 'Entscheidungen konnten nicht geladen werden.')
        } else {
          setDecisions(Array.isArray(result.data.decisions) ? result.data.decisions : [])
          setTotal(typeof result.data.total === 'number' ? result.data.total : 0)
        }
      } catch (error) {
        if (cancelled) return
        setDecisions([])
        setTotal(0)
        setErrorMessage(error instanceof Error ? error.message : 'Entscheidungen konnten nicht geladen werden.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => { cancelled = true }
  }, [statusFilter, typeFilter, page, reloadToken])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError(null)
    const result = await apiFetch<unknown>(`/api/decisions/${deleteTarget.id}`, { method: 'DELETE' })
    if (!result.success) {
      setDeleteError(result.error || 'Fehler beim Löschen')
      setDeleting(false)
      return
    }
    setDeleteTarget(null)
    setReloadToken(prev => prev + 1)
    setDeleting(false)
  }

  const setStatusFilterAndReset = (v: string) => { setStatusFilter(v); setPage(1) }
  const setTypeFilterAndReset = (v: string) => { setTypeFilter(v); setPage(1) }
  const retry = () => setReloadToken(prev => prev + 1)
  const closeDeleteDialog = () => { setDeleteTarget(null); setDeleteError(null) }

  return {
    decisions,
    total,
    page,
    setPage,
    loading,
    errorMessage,
    statusFilter,
    setStatusFilter: setStatusFilterAndReset,
    typeFilter,
    setTypeFilter: setTypeFilterAndReset,
    deleteTarget,
    setDeleteTarget,
    deleting,
    deleteError,
    handleDelete,
    retry,
    closeDeleteDialog,
    PAGE_SIZE,
  }
}
