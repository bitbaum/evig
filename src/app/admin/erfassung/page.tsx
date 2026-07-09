'use client'

import { useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import { ProductForm } from '@/components/erfassung/ProductForm'
import { SuccessScreen } from '@/components/erfassung/SuccessScreen'
import { BulkTable } from '@/components/erfassung/BulkTable'
import { BulkDetailPanel } from '@/components/erfassung/BulkDetailPanel'
import { BulkActionBar } from '@/components/erfassung/BulkActionBar'
import { BulkSuccessScreen } from '@/components/erfassung/BulkSuccessScreen'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import { ErfassungSubmitBar } from '@/components/erfassung/ErfassungSubmitBar'
import { useErfassungForm } from '@/components/erfassung/useErfassungForm'
import { Button } from '@/components/ui/button'
import { Stepper } from '@/components/ui/Stepper'
import type { BulkProduct, BulkSaveResponse } from '@/types/erfassung'
import { formDataToPayload } from '@/types/erfassung'
import Heading from '@/components/admin/AdminHeading'
import { ProduktAufnehmenModeToggle } from '@/components/admin/ProduktAufnehmenModeToggle'
import { ROUTES } from '@/config/routes'
import { adminInteractive } from '@/lib/admin-ui'

const INTAKE_PIPELINE_STEPS = [
  { label: 'Geräte-Eingang', description: 'Checkliste & Spende' },
  { label: 'Erfassung', description: 'Produktdaten eingeben' },
  { label: 'Im Shop', description: 'Veröffentlichen' },
]

function ErfassungContent() {
  const form = useErfassungForm()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnToRaw = searchParams.get('returnTo') ?? ''
  // Only treat as intake pipeline when returnTo is a same-origin intake path
  const isIntakePipeline = returnToRaw.startsWith('/admin/intake')

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
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24 sm:pb-6">
      {/* Pipeline progress — shown when entering from Geräte-Eingang */}
      {isIntakePipeline && (
        <div className="bg-surface-base border border-default rounded-lg px-4 py-3">
          <Stepper
            steps={INTAKE_PIPELINE_STEPS}
            currentStep={1}
            onStepClick={(step) => { if (step === 0) router.push(returnToRaw) }}
          />
        </div>
      )}

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
            {form.isEditMode ? 'Produkt bearbeiten' : viewMode === 'bulk' ? `Bulk Erfassung (${bulkProducts.length} Produkte)` : 'Produkt Erfassung'}
          </Heading>
          <p className="text-sm sm:text-base text-text-secondary hidden sm:block">
            {form.isEditMode ? 'Produktdaten aktualisieren' : viewMode === 'bulk' ? 'Mehrere Produkte prüfen und erfassen' : 'Neues Produkt ins Inventar aufnehmen'}
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

      {/* Mode switch — Schnellerfassung (here) vs Physische Annahme (intake).
          One "Produkt aufnehmen" door, two modes; hidden in edit mode and when
          already inside the intake→erfassung pipeline. */}
      {!form.isEditMode && !isIntakePipeline && (
        <ProduktAufnehmenModeToggle active="schnell" />
      )}

      {/* Data Entry Tabs (always at top) */}
      <DataEntryTabs
        showAllTabs
        onProductData={form.handleProductData}
        onBulkData={handleBulkData}
        onImageCapture={form.handleImageCapture}
        onError={(error) => logger.error('Data entry error', { error })}
        onDataFilled={form.handleDataFilled}
        collapsed={form.dataEntryCollapsed}
      />

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
      {viewMode === 'single' && (
        <>
          {!!(form.formData.hersteller || form.formData.produktname) && (
            <AIFormAssist
              formType="erfassung"
              variant="section"
              defaultExpanded={form.showAIRefine}
              placeholder="z.B. Dell Latitude 7480, 16GB RAM, 512GB SSD, guter Zustand..."
              currentData={{
                hersteller: form.formData.hersteller,
                produktname: form.formData.produktname,
                kurzbeschreibung: form.formData.kurzbeschreibung,
                specs: form.formData.specs,
                verkaufspreis: form.formData.verkaufspreis,
                zustand: form.formData.zustand,
                hauptkategorie: form.formData.hauptkategorie,
                unterkategorie: form.formData.unterkategorie,
                kundenprofile: form.formData.kundenprofile,
              }}
              onFieldsFilled={form.handleProductData}
            />
          )}

          <form onSubmit={(e) => form.handleSubmit(e, 'draft')} className="space-y-6">
            {form.saveError && (
              <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg text-sm">
                {form.saveError}
              </div>
            )}
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

            <ErfassungSubmitBar
              isEditMode={form.isEditMode}
              isLoading={form.isLoading}
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
