'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import { INTAKE_TIERS, CHECKLIST_RESULTS, type IntakeTier, type ChecklistResult } from '@/config/intake-checklist'
import type { DetailData } from './types'

export function useIntakeDetail() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Publish
  const [publishPrice, setPublishPrice] = useState(0)
  const [publishing, setPublishing] = useState(false)

  // Tier change
  const [showTierChange, setShowTierChange] = useState(false)
  const [newTier, setNewTier] = useState<IntakeTier>(INTAKE_TIERS.REFURBISH)
  const [tierChangeReason, setTierChangeReason] = useState('')
  const [tierChanging, setTierChanging] = useState(false)

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const result = await apiFetch<DetailData>(`/api/admin/intake/${id}`)
      if (result.success && result.data) {
        setDetail(result.data)
        setPublishPrice(Number(result.data.selling_price_chf) || 0)
      }
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const openDetail = useCallback((id: string) => {
    setSelectedId(id)
    fetchDetail(id)
  }, [fetchDetail])

  const clearDetail = useCallback(() => {
    setDetail(null)
    setSelectedId(null)
    setShowTierChange(false)
    setTierChangeReason('')
  }, [])

  // Rejections (e.g. Vier-Augen-Prinzip) must be visible, not silent.
  const [checklistError, setChecklistError] = useState<string | null>(null)

  const setChecklistResult = useCallback(async (
    itemId: string,
    result: ChecklistResult | null,
    notes?: string,
    options?: { secondPersonOverride?: boolean },
  ) => {
    if (!selectedId) return
    setChecklistError(null)
    const body: Record<string, unknown> = { item_id: itemId, result }
    if (notes !== undefined) body.notes = notes
    if (options?.secondPersonOverride) body.second_person_override = true
    const response = await apiFetch<void>(`/api/admin/intake/${selectedId}/checklist`, {
      method: 'PATCH',
      body,
    })
    if (response.success) {
      fetchDetail(selectedId)
    } else {
      setChecklistError(response.error || null)
    }
  }, [selectedId, fetchDetail])

  const markAllRequired = useCallback(async () => {
    if (!selectedId || !detail) return
    setChecklistError(null)
    // Only OPEN items — never overrides a recorded fail/n.a. verdict, and
    // never auto-signs items that need a deliberate second person (final QA).
    const open = detail.checklist_grouped
      .flatMap(g => g.items)
      .filter(i => i.required && i.state.result === null && !i.requiresSecondPerson)
    if (open.length === 0) return
    const results = await Promise.all(
      open.map(item =>
        apiFetch<void>(`/api/admin/intake/${selectedId}/checklist`, {
          method: 'PATCH',
          body: { item_id: item.id, result: CHECKLIST_RESULTS.PASS },
        })
      )
    )
    const firstError = results.find(r => !r.success)
    if (firstError) setChecklistError(firstError.error || null)
    fetchDetail(selectedId)
  }, [selectedId, detail, fetchDetail])

  // Quick-captured device of a QC-required category: assign the refurbish
  // tier so the checklist workflow (and the publish gate) kicks in.
  const [startingQc, setStartingQc] = useState(false)
  const startQc = useCallback(async () => {
    if (!selectedId) return
    setStartingQc(true)
    try {
      const result = await apiFetch<void>(`/api/admin/intake/${selectedId}`, {
        method: 'PATCH',
        body: { intake_tier: INTAKE_TIERS.REFURBISH },
      })
      if (result.success) {
        fetchDetail(selectedId)
      }
    } finally {
      setStartingQc(false)
    }
  }, [selectedId, fetchDetail])

  const handlePublish = useCallback(async () => {
    if (!selectedId) return
    setPublishing(true)
    try {
      const result = await apiFetch<void>(`/api/admin/intake/${selectedId}/publish`, {
        method: 'POST',
        body: { price_chf: publishPrice },
      })
      if (result.success) {
        fetchDetail(selectedId)
      }
    } finally {
      setPublishing(false)
    }
  }, [selectedId, publishPrice, fetchDetail])

  const handleTierChange = useCallback(async () => {
    if (!selectedId || !tierChangeReason.trim()) return
    setTierChanging(true)
    try {
      const result = await apiFetch<void>(`/api/admin/intake/${selectedId}/change-tier`, {
        method: 'POST',
        body: { new_tier: newTier, reason: tierChangeReason },
      })
      if (result.success) {
        setShowTierChange(false)
        setTierChangeReason('')
        fetchDetail(selectedId)
      }
    } finally {
      setTierChanging(false)
    }
  }, [selectedId, newTier, tierChangeReason, fetchDetail])

  return {
    selectedId,
    detail,
    detailLoading,
    publishPrice, setPublishPrice,
    publishing,
    showTierChange, setShowTierChange,
    newTier, setNewTier,
    tierChangeReason, setTierChangeReason,
    tierChanging,
    openDetail,
    fetchDetail,
    clearDetail,
    setChecklistResult,
    checklistError,
    markAllRequired,
    startQc,
    startingQc,
    handlePublish,
    handleTierChange,
  }
}
