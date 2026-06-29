"use client"

/**
 * Product Management Dashboard
 *
 * Shows the Erfassung inventory (all products, draft + published). The old
 * "Shop Produkte" mirror tab was retired together with /api/shop/inventory —
 * published items are managed via the marketplace.
 *
 * Thin orchestrator — state lives in useProductActions,
 * sub-components are purely presentational.
 */

import React from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ProductStatsCards,
  ProductFilterBar,
  InventoryProductsTable,
} from './products'
import { ProductConfirmDialogs } from './products/ProductConfirmDialogs'
import { useProductActions } from './products/useProductActions'

export default function ProductManagement() {
  const actions = useProductActions()

  // Loading state
  if (actions.isLoading) {
    return (
      <div className="bg-surface-base rounded-xl shadow-xs border border p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <span className="ml-3 text-text-secondary">Produkte werden geladen...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (actions.error) {
    return (
      <div className="bg-surface-base rounded-xl shadow-xs border border p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text-primary mb-2">
            Fehler beim Laden der Produkte
          </h3>
          <p className="text-text-secondary mb-4">
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
      <ProductStatsCards inventoryStats={actions.inventoryStats} />

      <ProductFilterBar
        searchQuery={actions.searchQuery}
        onSearchChange={actions.setSearchQuery}
        filterStatus={actions.filterStatus}
        onFilterStatusChange={actions.setFilterStatus}
        filterCategory={actions.filterCategory}
        onFilterCategoryChange={actions.setFilterCategory}
        selectedCount={actions.selectedIds.size}
        onBulkDelete={actions.handleBulkDelete}
      />

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

      <ProductConfirmDialogs
        deleteTarget={actions.deleteTarget}
        isDeleting={actions.isDeleting}
        deleteError={actions.deleteError}
        onConfirmDelete={actions.handleConfirmDelete}
        onDismissDelete={actions.dismissDelete}
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
