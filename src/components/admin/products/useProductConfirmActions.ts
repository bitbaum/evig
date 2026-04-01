"use client"

/**
 * useProductConfirmActions — Confirmation dialog state + API calls
 * for publish, unpublish, delete, and bulk delete operations.
 *
 * Separated from useProductActions to keep each hook focused
 * and under the 250-line target.
 */

import { useState, useCallback } from 'react'
import { MARKETPLACE_STATUS } from '@/config/marketplace-status'
import { apiFetch } from '@/lib/api/client'

export interface DeleteTarget {
  type: 'shop' | 'inventory'
  id: string
  name: string
}

export interface ActionTarget {
  id: string
  name: string
}

/** Shared state + execute pattern for confirmation dialogs. */
function useConfirmFlow<T>(onSuccess: () => void) {
  const [target, setTarget] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const open = useCallback((t: T) => { setTarget(t); setError(null) }, [])
  const dismiss = useCallback(() => setTarget(null), [])

  const execute = useCallback(async (fn: () => Promise<void>) => {
    setLoading(true)
    setError(null)
    try {
      await fn()
      onSuccess()
      setTarget(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  return { target, loading, error, open, dismiss, execute }
}

async function patchInventory(id: string, body: Record<string, string>) {
  const result = await apiFetch(`/api/admin/inventory/${id}`, {
    method: 'PATCH',
    body,
  })
  if (!result.success) {
    throw new Error(result.error || 'Aktion fehlgeschlagen')
  }
}

async function deleteInventory(id: string) {
  const result = await apiFetch(`/api/admin/inventory/${id}`, { method: 'DELETE' })
  if (!result.success) {
    throw new Error(result.error || 'Löschen fehlgeschlagen')
  }
}

interface UseProductConfirmActionsOptions {
  refetchBoth: () => void
}

export function useProductConfirmActions({ refetchBoth }: UseProductConfirmActionsOptions) {
  // Confirmation flows (shared pattern)
  const deleteFlow = useConfirmFlow<DeleteTarget>(refetchBoth)
  const publishFlow = useConfirmFlow<ActionTarget>(refetchBoth)
  const unpublishFlow = useConfirmFlow<ActionTarget>(refetchBoth)

  // Bulk delete state (separate from single-delete)
  const [bulkDeletePending, setBulkDeletePending] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Confirm actions
  const handleConfirmPublish = useCallback(() => {
    if (!publishFlow.target) return
    return publishFlow.execute(() =>
      patchInventory(publishFlow.target!.id, { marketplace_status: MARKETPLACE_STATUS.PUBLISHED })
    )
  }, [publishFlow])

  const handleConfirmDelete = useCallback(() => {
    if (!deleteFlow.target) return
    return deleteFlow.execute(() => deleteInventory(deleteFlow.target!.id))
  }, [deleteFlow])

  const handleConfirmUnpublish = useCallback(() => {
    if (!unpublishFlow.target) return
    return unpublishFlow.execute(() =>
      patchInventory(unpublishFlow.target!.id, { marketplace_status: MARKETPLACE_STATUS.DRAFT })
    )
  }, [unpublishFlow])

  // Selection handlers
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id))
      return allSelected ? new Set() : new Set(ids)
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  // Bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return
    setBulkDeletePending(true)
    setBulkDeleteError(null)
  }, [selectedIds.size])

  const handleConfirmBulkDelete = useCallback(async () => {
    setIsBulkDeleting(true)
    setBulkDeleteError(null)

    try {
      const results = await Promise.allSettled(
        Array.from(selectedIds).map(id => deleteInventory(id))
      )

      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        setBulkDeleteError(`${failed.length} von ${selectedIds.size} Produkten konnten nicht gelöscht werden`)
      } else {
        setBulkDeletePending(false)
        setSelectedIds(new Set())
      }

      refetchBoth()
    } catch {
      setBulkDeleteError('Unbekannter Fehler beim Löschen')
    } finally {
      setIsBulkDeleting(false)
    }
  }, [selectedIds, refetchBoth])

  const dismissBulkDelete = useCallback(() => {
    setBulkDeletePending(false)
    setBulkDeleteError(null)
  }, [])

  return {
    // Selection
    selectedIds, handleToggleSelect, handleSelectAll, clearSelection, handleBulkDelete,

    // Delete dialog
    deleteTarget: deleteFlow.target,
    isDeleting: deleteFlow.loading,
    deleteError: deleteFlow.error,
    openDelete: deleteFlow.open,
    handleConfirmDelete,
    dismissDelete: deleteFlow.dismiss,

    // Unpublish dialog
    unpublishTarget: unpublishFlow.target,
    isUnpublishing: unpublishFlow.loading,
    unpublishError: unpublishFlow.error,
    openUnpublish: unpublishFlow.open,
    handleConfirmUnpublish,
    dismissUnpublish: unpublishFlow.dismiss,

    // Publish dialog
    publishTarget: publishFlow.target,
    isPublishing: publishFlow.loading,
    publishError: publishFlow.error,
    openPublish: publishFlow.open,
    handleConfirmPublish,
    dismissPublish: publishFlow.dismiss,

    // Bulk delete dialog
    bulkDeletePending, isBulkDeleting, bulkDeleteError,
    handleConfirmBulkDelete, dismissBulkDelete,
  }
}
