'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  Package,
  ChevronDown,
  ChevronUp,
  Wand2,
  Sparkles,
} from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import { ProductForm } from '@/components/erfassung/ProductForm'
import { SuccessScreen } from '@/components/erfassung/SuccessScreen'
import { BulkTable } from '@/components/erfassung/BulkTable'
import { BulkDetailPanel } from '@/components/erfassung/BulkDetailPanel'
import { BulkActionBar } from '@/components/erfassung/BulkActionBar'
import { BulkSuccessScreen } from '@/components/erfassung/BulkSuccessScreen'
import type { ErfassungFormData, AIFieldMetadata, BulkProduct, BulkSaveResponse } from '@/types/erfassung'
import { DEFAULT_FORM_DATA, formDataToPayload } from '@/types/erfassung'
import {
  SPEC_TEMPLATES,
} from '@/config/erfassung'
import { BULK_LIMITS } from '@/config/erfassung'

export default function ErfassungPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  // Single mode state
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [savedItemUUID, setSavedItemUUID] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState<ErfassungFormData>(DEFAULT_FORM_DATA)
  const [aiMetadata, setAiMetadata] = useState<AIFieldMetadata>({})

  // AI Refinement state
  const [showAIRefine, setShowAIRefine] = useState(false)
  const [aiInstruction, setAiInstruction] = useState('')
  const [aiRefining, setAiRefining] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiSuccess, setAiSuccess] = useState('')
  const [dataEntryCollapsed, setDataEntryCollapsed] = useState(false)

  // Bulk mode state
  const [viewMode, setViewMode] = useState<'single' | 'bulk'>('single')
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [bulkPage, setBulkPage] = useState(0)
  const [bulkSaveResult, setBulkSaveResult] = useState<BulkSaveResponse | null>(null)

  // Quick action prompts for refinement
  const AI_QUICK_ACTIONS = [
    { key: 'addSpecs', label: 'Specs ergänzen', prompt: 'Ergänze die technischen Spezifikationen basierend auf dem bekannten Produktmodell. Füge CPU, RAM, Speicher, Display-Grösse und andere relevante Specs hinzu.' },
    { key: 'estimatePrice', label: 'Preis schätzen', prompt: 'Schätze einen realistischen Verkaufspreis für den Schweizer Markt für gebrauchte Geräte. Berücksichtige Zustand, Alter und aktuelle Marktpreise auf ricardo.ch und tutti.ch.' },
    { key: 'improveDescription', label: 'Beschreibung verbessern', prompt: 'Verbessere die Kurzbeschreibung: Mache sie ansprechender und informativer. Hebe die wichtigsten Verkaufsargumente hervor.' },
  ]

  // Load existing product data in edit mode
  useEffect(() => {
    if (editId) {
      setIsEditMode(true)
      setIsLoadingProduct(true)
      setShowAdvanced(true)

      fetch(`/api/admin/inventory/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data?.product) {
            const p = data.data.product
            const specsArray = p.specifications
              ? Object.entries(p.specifications).map(([key, value]) => ({
                  key,
                  value: String(value),
                }))
              : [{ key: '', value: '' }]

            setFormData({
              hersteller: p.brand || '',
              produktname: p.product_name || '',
              kurzbeschreibung: p.short_description || '',
              specs: specsArray.length > 0 ? specsArray : [{ key: '', value: '' }],
              laenge_mm: p.dimensions?.laenge_mm?.toString() || '',
              breite_mm: p.dimensions?.breite_mm?.toString() || '',
              hoehe_mm: p.dimensions?.hoehe_mm?.toString() || '',
              gewicht_kg: p.weight_grams ? (p.weight_grams / 1000).toString() : '',
              verkaufspreis: p.estimated_price_chf?.toString() || '',
              zustand: p.condition || 'good',
              location: p.location || '',
              box_id: p.box_id || '',
              auf_lager: p.quantity_available?.toString() || '1',
              hauptkategorie: p.category || '',
              unterkategorie: p.subcategory || '',
              kundenprofile: p.customer_profiles || [],
              image: p.image_url || null,
            })
          }
        })
        .catch(err => {
          logger.error('Failed to load product for edit', { error: err, editId })
        })
        .finally(() => {
          setIsLoadingProduct(false)
        })
    }
  }, [editId])

  // Handle basic field changes
  const handleChange = (field: keyof ErfassungFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setAiMetadata(prev => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  // Handle category change
  const handleKategorieChange = (kategorie: string) => {
    setFormData(prev => ({
      ...prev,
      hauptkategorie: kategorie,
      unterkategorie: '',
      specs: SPEC_TEMPLATES[kategorie] || SPEC_TEMPLATES.default,
    }))
  }

  // Handle spec field changes
  const handleSpecChange = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...formData.specs]
    newSpecs[index] = { ...newSpecs[index], [field]: value }
    setFormData(prev => ({ ...prev, specs: newSpecs }))
  }

  const addSpecField = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', value: '' }]
    }))
  }

  const removeSpecField = (index: number) => {
    if (formData.specs.length > 1) {
      setFormData(prev => ({
        ...prev,
        specs: prev.specs.filter((_, i) => i !== index)
      }))
    }
  }

  const toggleProfile = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      kundenprofile: prev.kundenprofile.includes(slug)
        ? prev.kundenprofile.filter(p => p !== slug)
        : [...prev.kundenprofile, slug]
    }))
  }

  // Handle product data from DataEntryTabs (single product)
  const handleProductData = useCallback((data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => {
    logger.info('Product data received', { product: data.produktname, hasMetadata: !!metadata })

    setFormData(prev => ({
      ...prev,
      hersteller: data.hersteller || prev.hersteller,
      produktname: data.produktname || prev.produktname,
      kurzbeschreibung: data.kurzbeschreibung || prev.kurzbeschreibung,
      verkaufspreis: data.verkaufspreis || prev.verkaufspreis,
      zustand: data.zustand || prev.zustand,
      hauptkategorie: data.hauptkategorie || prev.hauptkategorie,
      unterkategorie: data.unterkategorie || prev.unterkategorie,
      kundenprofile: data.kundenprofile?.length ? data.kundenprofile : prev.kundenprofile,
      specs: data.specs?.length
        ? data.specs.map(s => ({ key: s.key, value: s.value }))
        : prev.specs,
    }))

    if (metadata) {
      setAiMetadata(prev => ({ ...prev, ...metadata }))
    }
  }, [])

  // Handle bulk data from DataEntryTabs (multiple products)
  const handleBulkData = useCallback((products: BulkProduct[]) => {
    logger.info('Bulk data received', { count: products.length })
    setBulkProducts(products)
    setViewMode('bulk')
    setBulkPage(0)
    setSelectedProductId(null)
    setBulkSaveResult(null)
  }, [])

  // Handle image capture
  const handleImageCapture = useCallback((imageBase64: string) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }))
  }, [])

  const handleDataFilled = useCallback(() => {
    setDataEntryCollapsed(true)
    setShowAIRefine(true)
  }, [])

  // Handle AI refinement
  const handleAIRefine = async (instruction?: string) => {
    const refineInstruction = instruction || aiInstruction
    if (!refineInstruction.trim()) {
      setAiError('Bitte geben Sie eine Anweisung ein')
      return
    }

    if (!formData.produktname && !formData.hersteller) {
      setAiError('Bitte geben Sie zuerst Hersteller oder Produktname ein')
      return
    }

    setAiError('')
    setAiSuccess('')
    setAiRefining(true)

    try {
      const res = await fetch('/api/admin/erfassung/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentProduct: {
            hersteller: formData.hersteller,
            produktname: formData.produktname,
            kurzbeschreibung: formData.kurzbeschreibung,
            specs: formData.specs,
            verkaufspreis: formData.verkaufspreis,
            zustand: formData.zustand,
            hauptkategorie: formData.hauptkategorie,
            unterkategorie: formData.unterkategorie,
            kundenprofile: formData.kundenprofile,
          },
          instruction: refineInstruction,
        }),
      })

      const data = await res.json()

      if (data.success && data.data?.refined) {
        const ref = data.data.refined
        setFormData(prev => ({
          ...prev,
          hersteller: ref.hersteller || prev.hersteller,
          produktname: ref.produktname || prev.produktname,
          kurzbeschreibung: ref.kurzbeschreibung || prev.kurzbeschreibung,
          specs: ref.specs?.length ? ref.specs : prev.specs,
          verkaufspreis: ref.verkaufspreis || prev.verkaufspreis,
          zustand: ref.zustand || prev.zustand,
          hauptkategorie: ref.hauptkategorie || prev.hauptkategorie,
          unterkategorie: ref.unterkategorie || prev.unterkategorie,
          kundenprofile: ref.kundenprofile?.length ? ref.kundenprofile : prev.kundenprofile,
        }))
        setAiInstruction('')
        const changedFields = data.data.fieldsChanged || []
        setAiSuccess(`KI hat ${changedFields.length} Felder verbessert: ${changedFields.join(', ')}`)
      } else {
        setAiError(data.error || 'Verbesserung fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setAiRefining(false)
    }
  }

  // Submit form (single mode)
  const handleSubmit = async (e: React.FormEvent, action: 'draft' | 'erfassen' | 'publish' = 'draft') => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const specifications: Record<string, string> = {}
      formData.specs.forEach(spec => {
        if (spec.key && spec.value) {
          specifications[spec.key] = spec.value
        }
      })

      if (isEditMode && editId) {
        const updatePayload = {
          product_name: formData.produktname,
          brand: formData.hersteller,
          short_description: formData.kurzbeschreibung,
          specifications,
          estimated_price_chf: parseFloat(formData.verkaufspreis) || 0,
          condition: formData.zustand,
          category: formData.hauptkategorie,
          subcategory: formData.unterkategorie,
          dimensions: {
            laenge_mm: parseInt(formData.laenge_mm) || null,
            breite_mm: parseInt(formData.breite_mm) || null,
            hoehe_mm: parseInt(formData.hoehe_mm) || null,
          },
          weight_grams: formData.gewicht_kg ? parseFloat(formData.gewicht_kg) * 1000 : null,
          location: formData.location,
          box_id: formData.box_id,
          quantity_available: parseInt(formData.auf_lager) || 1,
        }

        const response = await fetch(`/api/admin/inventory/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload),
        })

        if (!response.ok) {
          throw new Error('Failed to update product')
        }

        router.push('/admin/products')
      } else {
        const payload = formDataToPayload(formData, action)

        const response = await fetch('/api/admin/erfassung', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to save product')
        }

        const result = await response.json()
        if (result.success && result.data) {
          setSavedItemUUID(result.data.item_uuid)
          setSavedProductId(result.data.product_id)
        } else {
          throw new Error(result.error || 'Unbekannter Fehler')
        }
      }
    } catch (error) {
      logger.error('Error saving product', { error })
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setIsLoading(false)
    }
  }

  // Bulk handlers
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

    // Build payloads
    const payloads = selectedProducts.map(p => {
      return formDataToPayload(p, action)
    })

    // Mark selected as processing
    setBulkProducts(prev => prev.map(p =>
      p._selected ? { ...p, _status: 'processing' } : p
    ))

    try {
      const response = await fetch('/api/admin/erfassung/bulk-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: payloads, action }),
      })

      const json = await response.json()
      const result: BulkSaveResponse = json.data ?? json

      // Update individual product statuses
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

  // Reset handler for SuccessScreen
  const handleReset = useCallback(() => {
    setSavedItemUUID(null)
    setSavedProductId(null)
    setFormData(DEFAULT_FORM_DATA)
    setAiMetadata({})
    setShowAIRefine(false)
    setDataEntryCollapsed(false)
  }, [])

  // Loading state for edit mode
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Produkt wird geladen...</p>
        </div>
      </div>
    )
  }

  // Single mode: Success screen
  if (savedItemUUID && savedProductId) {
    return (
      <SuccessScreen
        itemUUID={savedItemUUID}
        productId={savedProductId}
        onReset={handleReset}
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
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/admin/products"
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {isEditMode ? 'Produkt bearbeiten' : viewMode === 'bulk' ? `Bulk Erfassung (${bulkProducts.length} Produkte)` : 'Produkt Erfassung'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hidden sm:block">
            {isEditMode ? 'Produktdaten aktualisieren' : viewMode === 'bulk' ? 'Mehrere Produkte prüfen und erfassen' : 'Neues Produkt ins Inventar aufnehmen'}
          </p>
        </div>
        {viewMode === 'bulk' && (
          <button
            type="button"
            onClick={handleBulkReset}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Zurück zur Einzelerfassung
          </button>
        )}
      </div>

      {/* Data Entry Tabs (always at top) */}
      <DataEntryTabs
        onProductData={handleProductData}
        onBulkData={handleBulkData}
        onImageCapture={handleImageCapture}
        onError={(error) => logger.error('Data entry error', { error })}
        onDataFilled={handleDataFilled}
        collapsed={dataEntryCollapsed}
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
          {/* AI Refinement Section */}
          {(formData.hersteller || formData.produktname) && (
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700 p-4 sm:p-6">
              <button
                type="button"
                onClick={() => setShowAIRefine(!showAIRefine)}
                className="w-full flex items-center justify-between"
              >
                <h2 className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Mit KI verbessern
                </h2>
                {showAIRefine ? (
                  <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                )}
              </button>

              {showAIRefine && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Nutze KI, um fehlende Daten zu ergänzen oder die Produktinformationen zu verbessern.
                  </p>

                  {aiError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                      {aiError}
                    </div>
                  )}
                  {aiSuccess && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                      {aiSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Schnellaktionen
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AI_QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.key}
                          type="button"
                          onClick={() => handleAIRefine(action.prompt)}
                          disabled={aiRefining}
                          className="px-3 py-1.5 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-700/50 disabled:opacity-50 transition-colors touch-manipulation"
                        >
                          <Sparkles className="w-3 h-3 inline mr-1" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-purple-200 dark:border-purple-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-500">oder</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      Eigene Anweisung
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        rows={2}
                        className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        placeholder='z.B. "Finde die genauen Spezifikationen für dieses ThinkPad Modell"'
                        disabled={aiRefining}
                      />
                      <button
                        type="button"
                        onClick={() => handleAIRefine()}
                        disabled={aiRefining || !aiInstruction.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors touch-manipulation"
                      >
                        {aiRefining ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Wand2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
            <ProductForm
              formData={formData}
              aiMetadata={aiMetadata}
              showAdvanced={showAdvanced}
              isEditMode={isEditMode}
              onFieldChange={handleChange}
              onSpecChange={handleSpecChange}
              onCategoryChange={handleKategorieChange}
              onProfileToggle={toggleProfile}
              onSpecAdd={addSpecField}
              onSpecRemove={removeSpecField}
              onImageChange={(image) => setFormData(prev => ({ ...prev, image }))}
              onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
            />

            {/* Submit Buttons - Desktop */}
            <div className="hidden sm:flex justify-between items-center pt-4">
              <Link
                href="/admin/products"
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
              >
                Abbrechen
              </Link>

              <div className="flex gap-3">
                {isEditMode ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Speichere...</>
                    ) : (
                      <><Save className="w-5 h-5" /> Änderungen speichern</>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Save className="w-5 h-5" /> Entwurf</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'erfassen')}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Package className="w-5 h-5" /> Erfassen</>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'publish')}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-5 py-3 rounded-lg transition-colors"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <><Package className="w-5 h-5" /> Erfassen & Shop</>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </form>

          {/* Mobile Sticky Bottom Bar */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50 safe-area-inset-bottom">
            {isEditMode ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  const form = document.querySelector('form')
                  if (form) form.requestSubmit()
                }}
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Änderungen speichern</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'draft')}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold px-3 py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'erfassen')}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>Erfassen</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'publish')}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      <span>+ Shop</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
