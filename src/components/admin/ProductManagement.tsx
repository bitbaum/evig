"use client"

/**
 * Product Management Dashboard
 *
 * Two tabs:
 * - Erfasste Produkte: ALL products from Erfassung (draft + published)
 * - Shop Produkte: ONLY published products (mirrors customer shop exactly)
 *
 * Thin orchestrator — state lives in useProductActions,
 * sub-components are purely presentational.
 */

import React from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ProductTabSwitcher,
  ProductStatsCards,
  ProductFilterBar,
  InventoryProductsTable,
  ShopProductsTable,
} from './products'
import { ProductConfirmDialogs } from './products/ProductConfirmDialogs'
import { useProductActions } from './products/useProductActions'

export default function ProductManagement() {
  const actions = useProductActions()

  // Loading state
  if (actions.isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-3 text-neutral-600">Produkte werden geladen...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (actions.error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            Fehler beim Laden der Produkte
          </h3>
          <p className="text-neutral-600 mb-4">
            {actions.error.message || 'Bitte versuchen Sie es später erneut.'}
          </p>
          <Button onClick={() => actions.refetch()} variant="primary" size="sm">
            Erneut versuchen
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ProductTabSwitcher
        activeTab={actions.activeTab}
        onTabChange={actions.handleTabChange}
        inventoryStats={actions.inventoryStats}
        shopStats={actions.shopStats}
      />

      <ProductStatsCards
        activeTab={actions.activeTab}
        inventoryStats={actions.inventoryStats}
        shopStats={actions.shopStats}
      />

      <ProductFilterBar
        searchQuery={actions.searchQuery}
        onSearchChange={actions.setSearchQuery}
        filterStatus={actions.filterStatus}
        onFilterStatusChange={actions.setFilterStatus}
        filterCategory={actions.filterCategory}
        onFilterCategoryChange={actions.setFilterCategory}
        selectedCount={actions.selectedIds.size}
        onBulkDelete={actions.handleBulkDelete}
        activeTab={actions.activeTab}
      />

      {actions.activeTab === 'inventory' ? (
        <InventoryProductsTable
          products={actions.inventoryProducts}
          searchQuery={actions.searchQuery}
          selectedIds={actions.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          onView={actions.handleViewInventory}
          onEdit={actions.handleEditInventory}
          onDelete={actions.handleDeleteInventory}
          onPublish={actions.handlePublishInventory}
        />
      ) : (
        <ShopProductsTable
          products={actions.shopProducts}
          searchQuery={actions.searchQuery}
          selectedIds={actions.selectedIds}
          onToggleSelect={actions.handleToggleSelect}
          onSelectAll={actions.handleSelectAll}
          onView={actions.handleViewShop}
          onEdit={actions.handleEditShop}
          onUnpublish={actions.handleUnpublishShop}
          onDelete={actions.handleDeleteShop}
        />
      )}

      <ProductConfirmDialogs
        deleteTarget={actions.deleteTarget}
        isDeleting={actions.isDeleting}
        deleteError={actions.deleteError}
        onConfirmDelete={actions.handleConfirmDelete}
        onDismissDelete={actions.dismissDelete}
        unpublishTarget={actions.unpublishTarget}
        isUnpublishing={actions.isUnpublishing}
        unpublishError={actions.unpublishError}
        onConfirmUnpublish={actions.handleConfirmUnpublish}
        onDismissUnpublish={actions.dismissUnpublish}
        publishTarget={actions.publishTarget}
        isPublishing={actions.isPublishing}
        publishError={actions.publishError}
        onConfirmPublish={actions.handleConfirmPublish}
        onDismissPublish={actions.dismissPublish}
        bulkDeletePending={actions.bulkDeletePending}
        selectedCount={actions.selectedIds.size}
        isBulkDeleting={actions.isBulkDeleting}
        bulkDeleteError={actions.bulkDeleteError}
        onConfirmBulkDelete={actions.handleConfirmBulkDelete}
        onDismissBulkDelete={actions.dismissBulkDelete}
      />
    </div>
  )
}
