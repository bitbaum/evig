'use client'

import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { Loader2 } from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import { SuccessScreen } from '@/components/erfassung/SuccessScreen'
import { BulkSuccessScreen } from '@/components/erfassung/BulkSuccessScreen'
import { useErfassungForm } from '@/components/erfassung/useErfassungForm'
import type { BulkProduct, BulkSaveResponse } from '@/types/erfassung'
import { formDataToPayload } from '@/types/erfassung'
import { ErfassungHeader } from './page-sections/ErfassungHeader'
import { CaptureSteps } from './page-sections/CaptureSteps'
import { BulkSection } from './page-sections/BulkSection'
import { SingleCaptureForm } from './page-sections/SingleCaptureForm'

function ErfassungContent() {
  const form = useErfassungForm()

  // Bulk mode state
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single')
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [bulkPage, setBulkPage] = useState(0)
  const [bulkSaveResult, setBulkSaveResult] = useState<BulkSaveResponse | null>(null)

  // When the AI fills the form (or the operator picks manual entry), bring the
  // review step into view. Without this the form silently appears below the
  // fold on mobile and "where did step 2 go?" is a real complaint.
  const reviewRef = useRef<HTMLFormElement>(null)
  const wasReviewing = useRef(false)
  useEffect(() => {
    if (form.reviewStarted && !wasReviewing.current && !form.isEditMode) {
      reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    wasReviewing.current = form.reviewStarted
  }, [form.reviewStarted, form.isEditMode])

  // Bulk handlers
  const handleBulkData = useCallback((products: BulkProduct[]) => {
    logger.info('Bulk data received', { count: products.length })
    setBulkProducts(products)
    setViewMode('bulk')
    setBulkPage(0)
    setSelectedProductId(null)
    setBulkSaveResult(null)
  }, [])

  const handleBulkProductUpdate = useCallback((tempId: string, updates: Partial<BulkProduct>) => {
    setBulkProducts(prev => prev.map(p =>
      p._tempId === tempId ? { ...p, ...updates } : p
    ))
  }, [])

  const handleBulkProductSelect = useCallback((tempId: string) => {
    setBulkProducts(prev => prev.map(p =>
      p._tempId === tempId ? { ...p, _selected: !p._selected } : p
    ))
  }, [])

  const handleBulkSelectAll = useCallback(() => {
    setBulkProducts(prev => {
      const allSelected = prev.every(p => p._selected)
      return prev.map(p => ({ ...p, _selected: !allSelected }))
    })
  }, [])

  const handleBulkSave = useCallback(async (action: 'draft' | 'erfassen' | 'publish') => {
    const selectedProducts = bulkProducts.filter(p => p._selected)
    if (selectedProducts.length === 0) return

    const payloads = selectedProducts.map(p => formDataToPayload(p, action))

    setBulkProducts(prev => prev.map(p =>
      p._selected ? { ...p, _status: 'processing' } : p
    ))

    try {
      const response = await apiFetch<BulkSaveResponse>('/api/admin/erfassung/bulk-save', {
        method: 'POST',
        body: { products: payloads, action },
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Bulk save failed')
      }
      const result = response.data

      setBulkProducts(prev => {
        const updated = [...prev]
        const selectedIds = selectedProducts.map(p => p._tempId)
        let resultIdx = 0
        for (let i = 0; i < updated.length; i++) {
          if (selectedIds.includes(updated[i]._tempId) && result.results[resultIdx]) {
            const r = result.results[resultIdx]
            updated[i] = {
              ...updated[i],
              _status: r.success ? 'saved' : 'error',
              _errors: r.error ? [r.error] : [],
              _saveResult: r,
            }
            resultIdx++
          }
        }
        return updated
      })

      setBulkSaveResult(result)
    } catch (error) {
      logger.error('Bulk save failed', { error })
      setBulkProducts(prev => prev.map(p =>
        p._selected && p._status === 'processing'
          ? { ...p, _status: 'error', _errors: ['Netzwerkfehler'] }
          : p
      ))
    }
  }, [bulkProducts])

  const handleBulkReset = useCallback(() => {
    setBulkProducts([])
    setViewMode('single')
    setBulkSaveResult(null)
    setSelectedProductId(null)
  }, [])

  const handleBulkRetryFailed = useCallback(() => {
    setBulkProducts(prev => prev.filter(p => p._status === 'error'))
    setBulkSaveResult(null)
  }, [])

  // Loading state for edit mode
  if (form.isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-action animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Produkt wird geladen...</p>
        </div>
      </div>
    )
  }

  // Single mode: Success screen
  if (form.savedItemUUID && form.savedProductId) {
    return (
      <SuccessScreen
        itemUUID={form.savedItemUUID}
        productId={form.savedProductId}
        inventoryId={form.savedInventoryId}
        action={form.savedAction}
        listingId={form.savedListingId}
        qcRequired={form.savedQcRequired}
        sellingPriceChf={Number(form.formData.verkaufspreis) || null}
        onReset={form.handleReset}
      />
    )
  }

  // Bulk mode: Success screen
  if (viewMode === 'bulk' && bulkSaveResult) {
    return (
      <BulkSuccessScreen
        result={bulkSaveResult}
        onRetryFailed={handleBulkRetryFailed}
        onReset={handleBulkReset}
      />
    )
  }

  return (
    // pb-44 clears the fixed mobile submit bar (~84px) stacked above the
    // admin bottom nav (56px + safe area).
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-44 sm:pb-6">
      {/* Header */}
      <ErfassungHeader
        form={form}
        viewMode={viewMode}
        bulkProducts={bulkProducts}
        handleBulkReset={handleBulkReset}
      />

      {!form.isEditMode && <CaptureSteps form={form} />}

      {/* One input step; the channel does not change the workflow. */}
      {!form.isEditMode && (
        <DataEntryTabs
          showAllTabs
          onProductData={form.handleProductData}
          onBulkData={handleBulkData}
          onImageCapture={form.handleImageCapture}
          onError={(error) => logger.error('Data entry error', { error })}
          onDataFilled={form.handleDataFilled}
          onManualEntry={form.handleManualEntry}
          collapsed={form.dataEntryCollapsed}
        />
      )}

      {/* BULK MODE */}
      {viewMode === 'bulk' && (
        <BulkSection
          bulkProducts={bulkProducts}
          bulkPage={bulkPage}
          setBulkPage={setBulkPage}
          selectedProductId={selectedProductId}
          setSelectedProductId={setSelectedProductId}
          handleBulkProductUpdate={handleBulkProductUpdate}
          handleBulkProductSelect={handleBulkProductSelect}
          handleBulkSelectAll={handleBulkSelectAll}
          handleBulkSave={handleBulkSave}
        />
      )}

      {/* SINGLE MODE */}
      {viewMode === 'single' && (form.isEditMode || form.reviewStarted) && (
        <SingleCaptureForm form={form} reviewRef={reviewRef} />
      )}
    </div>
  )
}

function ErfassungFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-action animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Erfassung wird geladen...</p>
      </div>
    </div>
  )
}

export default function ErfassungPage() {
  return (
    <Suspense fallback={<ErfassungFallback />}>
      <ErfassungContent />
    </Suspense>
  )
}
