"use client"

/**
 * Product Management Dashboard
 *
 * Two tabs:
 * - Erfasste Produkte: ALL products from Erfassung (draft + published)
 * - Shop Produkte: ONLY published products (mirrors customer shop exactly)
 */

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useInventoryProducts, type InventoryProduct } from '@/hooks/useInventoryProducts'
import { useShopProducts, type ShopProduct } from '@/hooks/useShopProducts'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ProductTabSwitcher,
  ProductStatsCards,
  ProductFilterBar,
  InventoryProductsTable,
  ShopProductsTable,
  type TabType,
  type FilterStatus,
  type InventoryStats,
  type ShopStats,
} from './products'

export default function ProductManagement() {
  const router = useRouter()

  // Data hooks
  const { data: shopData, isLoading: shopLoading, error: shopError, refetch: refetchShop } = useShopProducts({ limit: 100 })
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useInventoryProducts()

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'shop' | 'inventory'
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Unpublish confirmation state
  const [unpublishTarget, setUnpublishTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isUnpublishing, setIsUnpublishing] = useState(false)
  const [unpublishError, setUnpublishError] = useState<string | null>(null)

  // Publish confirmation state
  const [publishTarget, setPublishTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)

  // Derived state
  const isLoading = activeTab === 'shop' ? shopLoading : inventoryLoading
  const error = activeTab === 'shop' ? shopError : inventoryError
  const shopProducts = useMemo(() => shopData?.products || [], [shopData?.products])
  const inventoryProducts = useMemo(() => inventoryData?.products || [], [inventoryData?.products])

  // Calculate inventory stats
  const inventoryStats: InventoryStats = useMemo(() => ({
    total: inventoryProducts.length,
    published: inventoryProducts.filter(p => p.marketplace_status === 'published').length,
    draft: inventoryProducts.filter(p => p.marketplace_status === 'draft').length,
    approved: inventoryProducts.filter(p => p.status === 'approved').length,
    pending: inventoryProducts.filter(p => p.status === 'pending_review').length,
  }), [inventoryProducts])

  // Calculate shop stats
  const shopStats: ShopStats = useMemo(() => {
    const byCondition: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    shopProducts.forEach(p => {
      // Count by condition
      byCondition[p.condition] = (byCondition[p.condition] || 0) + 1

      // Count by category
      if (p.category) {
        byCategory[p.category] = (byCategory[p.category] || 0) + 1
      }
    })

    return {
      total: shopProducts.length,
      byCondition,
      byCategory,
      lowStock: shopProducts.filter(p => p.quantity < 3).length,
    }
  }, [shopProducts])

  // Shop product handlers
  const handleViewShop = (product: ShopProduct) => {
    // Open in customer shop
    window.open(`/shop/medusa/${product.id}`, '_blank')
  }

  const handleEditShop = (product: ShopProduct) => {
    // Navigate to erfassung with edit mode
    router.push(`/admin/erfassung?edit=${product.id}`)
  }

  const handleUnpublishShop = (product: ShopProduct) => {
    setUnpublishTarget({
      id: product.id,
      name: product.title,
    })
    setUnpublishError(null)
  }

  const handleDeleteShop = (product: ShopProduct) => {
    setDeleteTarget({
      type: 'shop',
      id: product.id,
      name: product.title,
    })
    setDeleteError(null)
  }

  // Inventory product handlers
  const handleViewInventory = (product: InventoryProduct) => {
    router.push(`/admin/products/${product.id}/factsheet`)
  }

  const handleEditInventory = (product: InventoryProduct) => {
    router.push(`/admin/erfassung?edit=${product.id}`)
  }

  const handleDeleteInventory = (product: InventoryProduct) => {
    setDeleteTarget({
      type: 'inventory',
      id: product.id,
      name: `${product.brand} ${product.product_name}`,
    })
    setDeleteError(null)
  }

  const handlePublishInventory = (product: InventoryProduct) => {
    setPublishTarget({
      id: product.id,
      name: `${product.brand} ${product.product_name}`,
    })
    setPublishError(null)
  }

  // Confirm publish
  const handleConfirmPublish = async () => {
    if (!publishTarget) return

    setIsPublishing(true)
    setPublishError(null)

    try {
      const response = await fetch(`/api/admin/inventory/${publishTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace_status: 'published' }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Veröffentlichen fehlgeschlagen')
      }

      // Refresh both lists
      refetchShop()
      refetchInventory()
      setPublishTarget(null)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsPublishing(false)
    }
  }

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const response = await fetch(`/api/admin/inventory/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Löschen fehlgeschlagen')
      }

      // Refresh both lists since deleting affects both
      refetchShop()
      refetchInventory()
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsDeleting(false)
    }
  }

  // Confirm unpublish
  const handleConfirmUnpublish = async () => {
    if (!unpublishTarget) return

    setIsUnpublishing(true)
    setUnpublishError(null)

    try {
      const response = await fetch(`/api/admin/inventory/${unpublishTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketplace_status: 'draft' }),
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Zurückziehen fehlgeschlagen')
      }

      // Refresh both lists
      refetchShop()
      refetchInventory()
      setUnpublishTarget(null)
    } catch (err) {
      setUnpublishError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsUnpublishing(false)
    }
  }

  const refetch = activeTab === 'shop' ? refetchShop : refetchInventory

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-3 text-gray-600">Produkte werden geladen...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Fehler beim Laden der Produkte
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message || 'Bitte versuchen Sie es später erneut.'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductTabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventoryStats={inventoryStats}
        shopStats={shopStats}
      />

      <ProductStatsCards
        activeTab={activeTab}
        inventoryStats={inventoryStats}
        shopStats={shopStats}
      />

      <ProductFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        selectedCount={0}
        onBulkDelete={() => {/* TODO: implement */}}
        activeTab={activeTab}
      />

      {activeTab === 'inventory' ? (
        <InventoryProductsTable
          products={inventoryProducts}
          searchQuery={searchQuery}
          onView={handleViewInventory}
          onEdit={handleEditInventory}
          onDelete={handleDeleteInventory}
          onPublish={handlePublishInventory}
        />
      ) : (
        <ShopProductsTable
          products={shopProducts}
          searchQuery={searchQuery}
          onView={handleViewShop}
          onEdit={handleEditShop}
          onUnpublish={handleUnpublishShop}
          onDelete={handleDeleteShop}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Produkt löschen"
        message="Sind Sie sicher, dass Sie dieses Produkt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
        itemName={deleteTarget?.name}
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        isLoading={isDeleting}
        error={deleteError}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Unpublish confirmation dialog */}
      <ConfirmDialog
        isOpen={!!unpublishTarget}
        title="Aus Shop entfernen"
        message="Möchten Sie dieses Produkt aus dem Shop entfernen? Es bleibt in den erfassten Produkten erhalten und kann jederzeit wieder veröffentlicht werden."
        itemName={unpublishTarget?.name}
        confirmLabel="Aus Shop entfernen"
        cancelLabel="Abbrechen"
        isLoading={isUnpublishing}
        error={unpublishError}
        variant="warning"
        onConfirm={handleConfirmUnpublish}
        onClose={() => setUnpublishTarget(null)}
      />

      {/* Publish confirmation dialog */}
      <ConfirmDialog
        isOpen={!!publishTarget}
        title="Im Shop veröffentlichen"
        message="Möchten Sie dieses Produkt im Shop veröffentlichen? Es wird sofort für Kunden sichtbar."
        itemName={publishTarget?.name}
        confirmLabel="Veröffentlichen"
        cancelLabel="Abbrechen"
        isLoading={isPublishing}
        error={publishError}
        variant="success"
        onConfirm={handleConfirmPublish}
        onClose={() => setPublishTarget(null)}
      />
    </div>
  )
}
