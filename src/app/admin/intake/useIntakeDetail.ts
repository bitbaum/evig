'use client'

import { useState, useCallback } from 'react'
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
      const res = await fetch(`/api/admin/intake/${id}`)
      const json = await res.json()
      if (json.success) {
        setDetail(json.data)
        setPublishPrice(json.data.selling_price_chf || 0)
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

  const toggleChecklist = useCallback(async (itemId: string, completed: boolean) => {
    if (!selectedId) return
    const res = await fetch(`/api/admin/intake/${selectedId}/checklist`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, completed }),
    })
    const json = await res.json()
    if (json.success) {
      fetchDetail(selectedId)
    }
  }, [selectedId, fetchDetail])

  const handlePublish = useCallback(async () => {
    if (!selectedId) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/admin/intake/${selectedId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_chf: publishPrice }),
      })
      const json = await res.json()
      if (json.success) {
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
      const res = await fetch(`/api/admin/intake/${selectedId}/change-tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_tier: newTier, reason: tierChangeReason }),
      })
      const json = await res.json()
      if (json.success) {
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
    handlePublish,
    handleTierChange,
  }
}
