'use client'

import { useState, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'
import type { IntakeTier } from '@/config/intake-checklist'
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
  const [newTier, setNewTier] = useState<IntakeTier>('refurbish')
  const [tierChangeReason, setTierChangeReason] = useState('')
  const [tierChanging, setTierChanging] = useState(false)

  const fetchDetail = useCallback(async (id: string) => {
    setDetailLoading(true)
    try {
      const result = await apiFetch<DetailData>(`/api/admin/intake/${id}`)
      if (result.success && result.data) {
        setDetail(result.data)
        setPublishPrice(result.data.selling_price_chf || 0)
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

  const toggleChecklist = useCallback(async (itemId: string, completed: boolean, notes?: string) => {
    if (!selectedId) return
    const body: Record<string, unknown> = { item_id: itemId, completed }
    if (notes !== undefined) body.notes = notes
    const result = await apiFetch<void>(`/api/admin/intake/${selectedId}/checklist`, {
      method: 'PATCH',
      body,
    })
    if (result.success) {
      fetchDetail(selectedId)
    }
  }, [selectedId, fetchDetail])

  const markAllRequired = useCallback(async () => {
    if (!selectedId || !detail) return
    const uncompleted = detail.checklist_grouped
      .flatMap(g => g.items)
      .filter(i => i.required && !i.state.completed)
    if (uncompleted.length === 0) return
    await Promise.all(
      uncompleted.map(item =>
        apiFetch<void>(`/api/admin/intake/${selectedId}/checklist`, {
          method: 'PATCH',
          body: { item_id: item.id, completed: true },
        })
      )
    )
    fetchDetail(selectedId)
  }, [selectedId, detail, fetchDetail])

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
    toggleChecklist,
    markAllRequired,
    handlePublish,
    handleTierChange,
  }
}
