'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { WorkshopProposalWithProposer } from '@/components/workshops/types'

export function useWorkshopProposalDetail(proposalId: string) {
  const [proposal, setProposal] = useState<WorkshopProposalWithProposer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const fetchProposal = useCallback(async () => {
    try {
      setIsLoading(true)
      const result = await apiFetch<{ proposal: WorkshopProposalWithProposer }>(
        `/api/admin/workshops/proposals/${proposalId}`,
      )
      if (result.success && result.data?.proposal) {
        setProposal(result.data.proposal)
      } else {
        if (result.error) logger.warn('Error fetching proposal', { error: result.error })
        setError(result.error || 'Fehler beim Laden des Vorschlags')
      }
    } finally {
      setIsLoading(false)
    }
  }, [proposalId])

  useEffect(() => {
    fetchProposal()
  }, [fetchProposal])

  const handleEditSaved = () => {
    setShowEditModal(false)
    fetchProposal()
  }

  return {
    proposal,
    isLoading,
    error,
    showEditModal,
    setShowEditModal,
    handleEditSaved,
  }
}
