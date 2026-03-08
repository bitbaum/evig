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
import { useShopProducts, type ShopProduct } from '@/hooks/useShopProducts'
import { MARKETPLACE_STATUS, PRODUCT_STATUS } from '@/config/marketplace-status'
import type { TabType, FilterStatus, InventoryStats, ShopStats } from './types'
import { useProductConfirmActions } from './useProductConfirmActions'

// Re-export types needed by consumers
export type { DeleteTarget, ActionTarget } from './useProductConfirmActions'

export function useProductActions() {
  const router = useRouter()

  // Data hooks
  const { data: shopData, isLoading: shopLoading, error: shopError, refetch: refetchShop } = useShopProducts({ limit: 100 })
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useInventoryProducts()

  // UI filter state
  const [activeTab, setActiveTab] = useState<TabType>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Derived data
  const isLoading = activeTab === 'shop' ? shopLoading : inventoryLoading
  const error = activeTab === 'shop' ? shopError : inventoryError
  const shopProducts = useMemo(() => shopData?.products || [], [shopData?.products])
  const inventoryProducts = useMemo(() => inventoryData?.products || [], [inventoryData?.products])
  const refetch = activeTab === 'shop' ? refetchShop : refetchInventory
  const refetchBoth = useCallback(() => { refetchShop(); refetchInventory() }, [refetchShop, refetchInventory])

  // Confirmation flows (delegated)
  const confirm = useProductConfirmActions({ refetchBoth })

  // Computed stats
  const inventoryStats: InventoryStats = useMemo(() => ({
    total: inventoryProducts.length,
    published: inventoryProducts.filter(p => p.marketplace_status === MARKETPLACE_STATUS.PUBLISHED).length,
    draft: inventoryProducts.filter(p => p.marketplace_status === MARKETPLACE_STATUS.DRAFT).length,
    approved: inventoryProducts.filter(p => p.status === PRODUCT_STATUS.APPROVED).length,
    pending: inventoryProducts.filter(p => p.status === PRODUCT_STATUS.PENDING_REVIEW).length,
  }), [inventoryProducts])

  const shopStats: ShopStats = useMemo(() => {
    const byCondition: Record<string, number> = {}
    const byCategory: Record<string, number> = {}
    shopProducts.forEach(p => {
      byCondition[p.condition] = (byCondition[p.condition] || 0) + 1
      if (p.category) byCategory[p.category] = (byCategory[p.category] || 0) + 1
    })
    return {
      total: shopProducts.length,
      byCondition,
      byCategory,
      lowStock: shopProducts.filter(p => p.quantity < 3).length,
    }
  }, [shopProducts])

  // Shop product handlers
  const handleViewShop = useCallback((product: ShopProduct) => {
    window.open(`/marketplace/${product.id}`, '_blank')
  }, [])

  const handleEditShop = useCallback((product: ShopProduct) => {
    router.push(`/admin/erfassung?edit=${product.id}`)
  }, [router])

  const handleUnpublishShop = useCallback((product: ShopProduct) => {
    confirm.openUnpublish({ id: product.id, name: product.title })
  }, [confirm])

  const handleDeleteShop = useCallback((product: ShopProduct) => {
    confirm.openDelete({ type: 'shop', id: product.id, name: product.title })
  }, [confirm])

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

  // Tab change (clears selection)
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab)
    confirm.clearSelection()
  }, [confirm])

  return {
    // Data
    shopProducts, inventoryProducts, isLoading, error, refetch,

    // Filter / UI state
    activeTab, handleTabChange,
    searchQuery, setSearchQuery,
    filterStatus, setFilterStatus,
    filterCategory, setFilterCategory,

    // Stats
    inventoryStats, shopStats,

    // Shop handlers
    handleViewShop, handleEditShop, handleUnpublishShop, handleDeleteShop,

    // Inventory handlers
    handleViewInventory, handleEditInventory, handleDeleteInventory, handlePublishInventory,

    // Delegated from confirm actions
    ...confirm,
  }
}
