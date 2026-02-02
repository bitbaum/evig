"use client"

/**
 * Product Management Dashboard
 *
 * Refactored to use extracted components for better maintainability.
 * Original 921 lines -> ~200 lines
 *
 * Components extracted:
 * - ProductTabSwitcher
 * - ProductStatsCards
 * - ProductFilterBar
 * - InventoryProductsTable
 * - MedusaProductsTable
 * - BulkImportModal
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useProducts, MedusaProduct } from '@/lib/medusa/hooks'
import { useInventoryProducts, type InventoryProduct } from '@/hooks/useInventoryProducts'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ProductTabSwitcher,
  ProductStatsCards,
  ProductFilterBar,
  InventoryProductsTable,
  MedusaProductsTable,
  BulkImportModal,
  type TabType,
  type FilterStatus,
  type FilterSource,
  type ProductWithOwner,
  type ProductStats,
  type InventoryStats,
} from './products'

// Mock user marketplace products (in real app, this would come from API)
const userMarketplaceProducts: ProductWithOwner[] = [
  {
    id: "user_prod_001",
    title: "Vintage MacBook Pro 2015",
    description: "Guter Zustand, alle Ports funktionieren",
    handle: "vintage-macbook-2015",
    subtitle: null,
    thumbnail: null,
    is_giftcard: false,
    discountable: true,
    collection_id: null,
    type_id: null,
    weight: null,
    material: null,
    images: [],
    options: [],
    status: "published",
    variants: [{
      id: "variant_001",
      title: "Default",
      sku: "user_prod_001",
      inventory_quantity: 1,
      allow_backorder: false,
      manage_inventory: true,
      product_id: "user_prod_001",
      prices: [{ amount: 45000, currency_code: "CHF" }],
      options: []
    }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: "user_123",
    owner_name: "Anna Müller"
  },
  {
    id: "user_prod_002",
    title: "Gaming Maus Logitech G305",
    description: "Wireless, kaum benutzt",
    handle: "gaming-maus-logitech",
    subtitle: null,
    thumbnail: null,
    is_giftcard: false,
    discountable: true,
    collection_id: null,
    type_id: null,
    weight: null,
    material: null,
    images: [],
    options: [],
    status: "published",
    variants: [{
      id: "variant_002",
      title: "Default",
      sku: "user_prod_002",
      inventory_quantity: 1,
      allow_backorder: false,
      manage_inventory: true,
      product_id: "user_prod_002",
      prices: [{ amount: 2500, currency_code: "CHF" }],
      options: []
    }],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owner_id: "user_456",
    owner_name: "Max Weber"
  }
]

export default function ProductManagement() {
  const router = useRouter()

  // Data hooks
  const { data: productsData, isLoading: medusaLoading, error: medusaError, refetch: refetchMedusa } = useProducts({ limit: 100 })
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useInventoryProducts()

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'medusa' | 'inventory'
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Derived state
  const isLoading = activeTab === 'medusa' ? medusaLoading : inventoryLoading
  const error = activeTab === 'medusa' ? medusaError : inventoryError
  const adminProducts = productsData?.products || []
  const allProducts = [...adminProducts, ...userMarketplaceProducts] as ProductWithOwner[]
  const inventoryProducts = inventoryData?.products || []

  // Calculate stats
  const medusaStats: ProductStats = {
    total: allProducts.length,
    published: allProducts.filter(p => p.status === 'published').length,
    draft: allProducts.filter(p => p.status === 'draft').length,
    lowStock: allProducts.filter(p => {
      const totalInventory = p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0
      return totalInventory < 5
    }).length,
    userListings: userMarketplaceProducts.length,
    adminInventory: adminProducts.length
  }

  const inventoryStats: InventoryStats = {
    total: inventoryProducts.length,
    published: inventoryProducts.filter(p => p.marketplace_status === 'published').length,
    draft: inventoryProducts.filter(p => p.marketplace_status === 'draft').length,
    approved: inventoryProducts.filter(p => p.status === 'approved').length,
    pending: inventoryProducts.filter(p => p.status === 'pending_review').length,
  }

  // Filter products for Medusa tab
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    const matchesCategory = filterCategory === 'all' ||
                           product.collection?.title?.toLowerCase().includes(filterCategory.toLowerCase())
    const matchesSource = filterSource === 'all' ||
                         (filterSource === 'admin' && !product.owner_id) ||
                         (filterSource === 'user' && product.owner_id)
    return matchesSearch && matchesStatus && matchesCategory && matchesSource
  })

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedProducts(checked ? filteredProducts.map(p => p.id) : [])
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked ? [...prev, productId] : prev.filter(id => id !== productId)
    )
  }

  // Product action handlers
  const handleViewMedusa = (product: ProductWithOwner) => {
    // Open in shop (public view)
    window.open(`/shop/products/${product.handle}`, '_blank')
  }

  const handleEditMedusa = (product: ProductWithOwner) => {
    // Navigate to edit page (will need to be created)
    router.push(`/admin/products/${product.id}/edit`)
  }

  const handleDeleteMedusa = (product: ProductWithOwner) => {
    setDeleteTarget({
      type: 'medusa',
      id: product.id,
      name: product.title,
    })
    setDeleteError(null)
  }

  const handleViewInventory = (product: InventoryProduct) => {
    // Open factsheet
    router.push(`/admin/products/${product.id}/factsheet`)
  }

  const handleEditInventory = (product: InventoryProduct) => {
    // Navigate to erfassung with edit mode
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

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const endpoint = deleteTarget.type === 'medusa'
        ? `/api/admin/products/${deleteTarget.id}`
        : `/api/admin/inventory/${deleteTarget.id}`

      const response = await fetch(endpoint, { method: 'DELETE' })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Löschen fehlgeschlagen')
      }

      // Refresh the appropriate list
      if (deleteTarget.type === 'medusa') {
        refetchMedusa()
      } else {
        refetchInventory()
      }

      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsDeleting(false)
    }
  }

  const refetch = activeTab === 'medusa' ? refetchMedusa : refetchInventory

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
        medusaStats={medusaStats}
      />

      <ProductStatsCards
        activeTab={activeTab}
        inventoryStats={inventoryStats}
        medusaStats={medusaStats}
      />

      <ProductFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        filterSource={filterSource}
        onFilterSourceChange={setFilterSource}
        selectedCount={selectedProducts.length}
        onBulkDelete={() => {/* TODO: implement */}}
        activeTab={activeTab}
        onShowBulkImport={() => setShowBulkImport(true)}
      />

      {activeTab === 'inventory' ? (
        <InventoryProductsTable
          products={inventoryProducts}
          searchQuery={searchQuery}
          onView={handleViewInventory}
          onEdit={handleEditInventory}
          onDelete={handleDeleteInventory}
        />
      ) : (
        <MedusaProductsTable
          products={filteredProducts}
          selectedProducts={selectedProducts}
          onSelectAll={handleSelectAll}
          onSelectProduct={handleSelectProduct}
          searchQuery={searchQuery}
          onView={handleViewMedusa}
          onEdit={handleEditMedusa}
          onDelete={handleDeleteMedusa}
        />
      )}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Produkt löschen"
        message="Sind Sie sicher, dass Sie dieses Produkt löschen möchten?"
        itemName={deleteTarget?.name}
        confirmLabel="Endgültig löschen"
        cancelLabel="Abbrechen"
        isLoading={isDeleting}
        error={deleteError}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
