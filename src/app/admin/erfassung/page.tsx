'use client'

import { useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import { ProductForm } from '@/components/erfassung/ProductForm'
import { SuccessScreen } from '@/components/erfassung/SuccessScreen'
import { BulkTable } from '@/components/erfassung/BulkTable'
import { BulkDetailPanel } from '@/components/erfassung/BulkDetailPanel'
import { BulkActionBar } from '@/components/erfassung/BulkActionBar'
import { BulkSuccessScreen } from '@/components/erfassung/BulkSuccessScreen'
import { CaptureDestinationFields } from '@/components/erfassung/CaptureDestinationFields'
import { ErfassungSubmitBar } from '@/components/erfassung/ErfassungSubmitBar'
import { useErfassungForm } from '@/components/erfassung/useErfassungForm'
import { Button } from '@/components/ui/button'
import type { BulkProduct, BulkSaveResponse } from '@/types/erfassung'
import { formDataToPayload } from '@/types/erfassung'
import Heading from '@/components/admin/AdminHeading'
import { ROUTES } from '@/config/routes'
import { adminInteractive } from '@/lib/admin-ui'
import { CAPTURE_DESTINATIONS } from '@/config/intake-workflow'

const CAPTURE_STEPS = [
  { number: 1, label: 'Daten eingeben' },
  { number: 2, label: 'KI-Daten prüfen' },
  { number: 3, label: 'Nächsten Schritt wählen' },
] as const

function ErfassungContent() {
  const form = useErfassungForm()

  // Bulk mode state
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single')
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [bulkPage, setBulkPage] = useState(0)
  const [bulkSaveResult, setBulkSaveResult] = useState<BulkSaveResponse | null>(null)

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

  const selectedBulkProduct = bulkProducts.find(p => p._tempId === selectedProductId) || null
  const selectedCount = bulkProducts.filter(p => p._selected).length
  const isBulkSaving = bulkProducts.some(p => p._status === 'processing')

  return (
    // pb-44 clears the fixed mobile submit bar (~84px) stacked above the
    // admin bottom nav (56px + safe area).
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-44 sm:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href={ROUTES.admin.intake}
          className={`p-2 sm:p-2 rounded-lg ${adminInteractive.rowHover} touch-manipulation`}
        >
          <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <Heading level={1} className="text-xl sm:text-2xl font-bold text-text-primary truncate">
            {form.isEditMode ? 'Produkt bearbeiten' : viewMode === 'bulk' ? `Import prüfen (${bulkProducts.length} Produkte)` : 'Produkt aufnehmen'}
          </Heading>
          <p className="text-sm sm:text-base text-text-secondary hidden sm:block">
            {form.isEditMode ? 'Produktdaten aktualisieren' : viewMode === 'bulk' ? 'KI-Ergebnis prüfen und ausgewählte Produkte ins Inventar übernehmen' : 'Daten eingeben, KI-Vorschlag prüfen und den nächsten realen Arbeitsschritt wählen'}
          </p>
        </div>
        {viewMode === 'bulk' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBulkReset}
            className="text-sm text-text-tertiary hover:text-text-secondary"
          >
            Zurück zur Einzelerfassung
          </Button>
        )}
      </div>

      {!form.isEditMode && (
        <ol className="grid grid-cols-3 overflow-hidden rounded-lg border border-default bg-surface-base" aria-label="Erfassungsschritte">
          {CAPTURE_STEPS.map((step, index) => {
            const hasInput = Boolean(form.formData.hersteller || form.formData.produktname)
            const hasRequiredData = Boolean(
              form.formData.hersteller.trim() && form.formData.produktname.trim(),
            )
            const complete = index === 0 ? hasInput : index === 1 ? hasRequiredData : false
            const active = index === 0
              ? !hasInput
              : index === 1
                ? hasInput && !hasRequiredData
                : hasRequiredData
            return (
              <li key={step.number} className={`flex min-w-0 items-center gap-2 border-r border-subtle px-2 py-2.5 text-xs last:border-r-0 sm:px-4 sm:text-sm ${active ? 'bg-action-muted text-action' : 'text-text-secondary'}`}>
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${active || complete ? 'bg-action text-action-text' : 'bg-surface-overlay text-text-secondary'}`}>
                  {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : step.number}
                </span>
                <span className="truncate">{step.label}</span>
              </li>
            )
          })}
        </ol>
      )}

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
        <>
          <BulkTable
            products={bulkProducts}
            page={bulkPage}
            onPageChange={setBulkPage}
            onProductUpdate={handleBulkProductUpdate}
            onProductSelect={handleBulkProductSelect}
            onSelectAll={handleBulkSelectAll}
            onProductClick={(tempId) => setSelectedProductId(tempId)}
          />

          {selectedBulkProduct && (
            <BulkDetailPanel
              key={selectedBulkProduct._tempId}
              product={selectedBulkProduct}
              onUpdate={(updates) => handleBulkProductUpdate(selectedBulkProduct._tempId, updates)}
              onClose={() => setSelectedProductId(null)}
            />
          )}

          <BulkActionBar
            totalCount={bulkProducts.length}
            selectedCount={selectedCount}
            isSaving={isBulkSaving}
            savedCount={bulkProducts.filter(p => p._status === 'saved').length}
            onSave={handleBulkSave}
            onSelectAll={handleBulkSelectAll}
            allSelected={bulkProducts.every(p => p._selected)}
          />
        </>
      )}

      {/* SINGLE MODE */}
      {viewMode === 'single' && (form.isEditMode || form.reviewStarted) && (
        <>
          <form data-product-form onSubmit={(e) => form.handleSubmit(e, 'erfassen')} className="space-y-5">
            {form.saveError && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg text-sm">
                {form.saveError}
              </div>
            )}
            <section aria-labelledby="capture-review-title" className="space-y-5">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action text-sm font-semibold text-action-text">2</div>
                <div>
                  <Heading level={2} id="capture-review-title" className="text-base font-semibold text-text-primary">
                    Produktdaten prüfen
                  </Heading>
                  <p className="mt-0.5 text-sm text-text-secondary">KI-Vorschläge kontrollieren. Nur Hersteller und Produktname sind zum Speichern nötig.</p>
                </div>
              </div>
              <ProductForm
                formData={form.formData}
                aiMetadata={form.aiMetadata}
                showAdvanced={form.showAdvanced}
                isEditMode={form.isEditMode}
                onFieldChange={form.handleChange}
                onSpecChange={form.handleSpecChange}
                onCategoryChange={form.handleKategorieChange}
                onProfileToggle={form.toggleProfile}
                onSpecAdd={form.addSpecField}
                onSpecRemove={form.removeSpecField}
                onImageChange={(image) => form.setFormData(prev => ({ ...prev, image }))}
                onToggleAdvanced={() => form.setShowAdvanced(!form.showAdvanced)}
              />
            </section>

            {!form.isEditMode && (
              <CaptureDestinationFields
                destination={form.destination}
                onDestinationChange={form.setDestination}
                qcSkipReason={form.qcSkipReason}
                onQcSkipReasonChange={form.setQcSkipReason}
                donation={form.donation}
                onDonationChange={form.setDonation}
              />
            )}

            <ErfassungSubmitBar
              isEditMode={form.isEditMode}
              isLoading={form.isLoading}
              destination={form.destination}
              canSubmit={Boolean(
                form.formData.hersteller.trim() &&
                form.formData.produktname.trim() &&
                (form.destination !== CAPTURE_DESTINATIONS.SHOP_UNTESTED || (
                  form.qcSkipReason.trim().length >= 10 &&
                  Number(form.formData.verkaufspreis) > 0
                ))
              )}
              onSubmit={form.handleSubmit}
            />
          </form>
        </>
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
