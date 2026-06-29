"use client"

/**
 * useProductActions — Data fetching, UI state, navigation handlers,
 * and computed stats for product management.
 *
 * Delegates confirmation flows (delete/publish/unpublish/bulk)
 * to useProductConfirmActions.
 */

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useInventoryProducts, type InventoryProduct } from '@/hooks/useInventoryProducts'
import { MARKETPLACE_STATUS, PRODUCT_STATUS } from '@/config/marketplace-status'
import type { FilterStatus, InventoryStats } from './types'
import { useProductConfirmActions } from './useProductConfirmActions'

// Re-export types needed by consumers
export type { DeleteTarget, ActionTarget } from './useProductConfirmActions'

export function useProductActions() {
  const router = useRouter()

  // Data hook — the Erfassung inventory (the shop-mirror tab was retired
  // along with /api/shop/inventory; published items live in the marketplace).
  const { data: inventoryData, isLoading, error, refetch: refetchInventory } = useInventoryProducts()

  // UI filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Derived data
  const inventoryProducts = useMemo(() => inventoryData?.products || [], [inventoryData?.products])
  const refetch = refetchInventory

  // Confirmation flows (delegated)
  const confirm = useProductConfirmActions({ refetchBoth: refetchInventory })

  // Computed stats — use server total for accuracy; status counts from current page
  const inventoryStats: InventoryStats = useMemo(() => ({
    total: inventoryData?.total ?? inventoryProducts.length,
    published: inventoryProducts.filter(p => p.marketplace_status === MARKETPLACE_STATUS.PUBLISHED).length,
    draft: inventoryProducts.filter(p => p.marketplace_status === MARKETPLACE_STATUS.DRAFT).length,
    approved: inventoryProducts.filter(p => p.status === PRODUCT_STATUS.APPROVED).length,
    pending: inventoryProducts.filter(p => p.status === PRODUCT_STATUS.PENDING_REVIEW).length,
  }), [inventoryData?.total, inventoryProducts])

  // Inventory product handlers
  const handleViewInventory = useCallback((product: InventoryProduct) => {
    router.push(`/admin/products/${product.id}/factsheet`)
  }, [router])

  const handleEditInventory = useCallback((product: InventoryProduct) => {
    router.push(`/admin/erfassung?edit=${product.id}`)
  }, [router])

  const handleDeleteInventory = useCallback((product: InventoryProduct) => {
    confirm.openDelete({
      type: 'inventory',
      id: product.id,
      name: `${product.brand} ${product.product_name}`,
    })
  }, [confirm])

  const handlePublishInventory = useCallback((product: InventoryProduct) => {
    confirm.openPublish({
      id: product.id,
      name: `${product.brand} ${product.product_name}`,
    })
  }, [confirm])

  return {
    // Data
    inventoryProducts, isLoading, error, refetch,

    // Filter / UI state
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,

    // Stats
    inventoryStats,

    // Inventory handlers
    handleViewInventory, handleEditInventory, handleDeleteInventory, handlePublishInventory,

    // Delegated from confirm actions
    ...confirm,
  }
}
