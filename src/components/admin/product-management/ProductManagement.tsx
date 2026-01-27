'use client'

import { useState } from 'react'
import { useProducts, MedusaProduct } from '@/lib/medusa/hooks'
import { useInventoryProducts } from './hooks/useInventoryProducts'
import {
  InventoryStats,
  MedusaStats,
  ProductFilters,
  InventoryProductTable,
  MedusaProductTable,
  BulkImportModal,
  TabSwitcher,
  LoadingState,
  ErrorState,
} from './components'
import type {
  ActiveTab,
  FilterStatus,
  FilterSource,
  ProductWithOwner,
  ProductStats,
  InventoryStatsData,
} from './types'

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
  // Data fetching
  const { data: productsData, isLoading: medusaLoading, error: medusaError, refetch } = useProducts({ limit: 100 })
  const { data: inventoryData, isLoading: inventoryLoading, error: inventoryError, refetch: refetchInventory } = useInventoryProducts()

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource] = useState<FilterSource>('all')
  const [showBulkImport, setShowBulkImport] = useState(false)

  // Derived state
  const isLoading = activeTab === 'medusa' ? medusaLoading : inventoryLoading
  const error = activeTab === 'medusa' ? medusaError : inventoryError
  const inventoryProducts = inventoryData?.products || []
  const adminProducts = productsData?.products || []
  const allMedusaProducts = [...adminProducts, ...userMarketplaceProducts] as ProductWithOwner[]

  // Calculate stats
  const medusaStats: ProductStats = {
    total: allMedusaProducts.length,
    published: allMedusaProducts.filter(p => p.status === 'published').length,
    draft: allMedusaProducts.filter(p => p.status === 'draft').length,
    lowStock: allMedusaProducts.filter(p => {
      const totalInventory = p.variants?.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0) || 0
      return totalInventory < 5
    }).length,
    userListings: userMarketplaceProducts.length,
    adminInventory: adminProducts.length
  }

  const inventoryStats: InventoryStatsData = {
    total: inventoryProducts.length,
    published: inventoryProducts.filter(p => p.marketplace_status === 'published').length,
    draft: inventoryProducts.filter(p => p.marketplace_status === 'draft').length,
    approved: inventoryProducts.filter(p => p.status === 'approved').length,
    pending: inventoryProducts.filter(p => p.status === 'pending_review').length,
  }

  // Filter Medusa products
  const filteredMedusaProducts = allMedusaProducts.filter(product => {
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
    setSelectedProducts(checked ? filteredMedusaProducts.map(p => p.id) : [])
  }

  const handleSelectProduct = (productId: string, checked: boolean) => {
    setSelectedProducts(prev =>
      checked
        ? [...prev, productId]
        : prev.filter(id => id !== productId)
    )
  }

  // Loading state
  if (isLoading) {
    return <LoadingState />
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => activeTab === 'medusa' ? refetch() : refetchInventory()}
      />
    )
  }

  return (
    <div className="space-y-6">
      <TabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        inventoryCount={inventoryStats.total}
        medusaCount={medusaStats.total}
      />

      {activeTab === 'inventory' ? (
        <InventoryStats stats={inventoryStats} />
      ) : (
        <MedusaStats stats={medusaStats} />
      )}

      <ProductFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterSource={filterSource}
        onFilterSourceChange={setFilterSource}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterCategory={filterCategory}
        onFilterCategoryChange={setFilterCategory}
        selectedCount={selectedProducts.length}
        onBulkImport={() => setShowBulkImport(true)}
        activeTab={activeTab}
      />

      {activeTab === 'inventory' ? (
        <InventoryProductTable
          products={inventoryProducts}
          searchQuery={searchQuery}
        />
      ) : (
        <MedusaProductTable
          products={filteredMedusaProducts}
          selectedProducts={selectedProducts}
          onSelectAll={handleSelectAll}
          onSelectProduct={handleSelectProduct}
        />
      )}

      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
      />
    </div>
  )
}
