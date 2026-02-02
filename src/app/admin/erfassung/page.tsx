'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  Loader2,
  Camera,
  Package,
  Ruler,
  MapPin,
  Users,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import { AIFieldIndicator } from '@/components/erfassung/AIFieldIndicator'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'
import { DEFAULT_FORM_DATA } from '@/types/erfassung'
import {
  CUSTOMER_PROFILES,
  ZUSTAND_OPTIONS,
  KATEGORIEN,
  SPEC_TEMPLATES,
  getProfilesByCategory,
} from '@/config/erfassung'

export default function ErfassungPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')

  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [savedItemUUID, setSavedItemUUID] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false) // Collapsed on mobile by default
  const [isEditMode, setIsEditMode] = useState(false)

  const [formData, setFormData] = useState<ErfassungFormData>(DEFAULT_FORM_DATA)
  const [aiMetadata, setAiMetadata] = useState<AIFieldMetadata>({})

  // Load existing product data in edit mode
  useEffect(() => {
    if (editId) {
      setIsEditMode(true)
      setIsLoadingProduct(true)
      setShowAdvanced(true) // Show all fields in edit mode

      fetch(`/api/admin/inventory/${editId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.product) {
            const p = data.product
            // Parse specifications JSON back to array
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

  // Handle basic field changes - clear AI metadata for the field when manually edited
  const handleChange = (field: keyof ErfassungFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear AI metadata for this field since user is manually editing
    setAiMetadata(prev => {
      const updated = { ...prev }
      delete updated[field]
      return updated
    })
  }

  // Handle category change - load spec template
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

  // Add new spec field
  const addSpecField = () => {
    setFormData(prev => ({
      ...prev,
      specs: [...prev.specs, { key: '', value: '' }]
    }))
  }

  // Remove spec field
  const removeSpecField = (index: number) => {
    if (formData.specs.length > 1) {
      setFormData(prev => ({
        ...prev,
        specs: prev.specs.filter((_, i) => i !== index)
      }))
    }
  }

  // Toggle customer profile
  const toggleProfile = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      kundenprofile: prev.kundenprofile.includes(slug)
        ? prev.kundenprofile.filter(p => p !== slug)
        : [...prev.kundenprofile, slug]
    }))
  }

  // Handle product data from DataEntryTabs (voice or image analysis)
  const handleProductData = useCallback((data: Partial<ErfassungFormData>, metadata?: AIFieldMetadata) => {
    logger.info('Product data received', { product: data.produktname, hasMetadata: !!metadata })

    // Merge incoming data with existing form data
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
      // Merge specs if provided
      specs: data.specs?.length
        ? data.specs.map(s => ({ key: s.key, value: s.value }))
        : prev.specs,
    }))

    // Store AI metadata for displaying confidence indicators
    if (metadata) {
      setAiMetadata(prev => ({
        ...prev,
        ...metadata,
      }))
    }
  }, [])

  // Handle image capture from DataEntryTabs
  const handleImageCapture = useCallback((imageBase64: string) => {
    setFormData(prev => ({ ...prev, image: imageBase64 }))
  }, [])

  // Submit form
  const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Build specs object from array
      const specifications: Record<string, string> = {}
      formData.specs.forEach(spec => {
        if (spec.key && spec.value) {
          specifications[spec.key] = spec.value
        }
      })

      if (isEditMode && editId) {
        // Update existing product
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

        // Navigate back to products list on success
        router.push('/admin/products')
      } else {
        // Create new product
        const payload = {
          hersteller: formData.hersteller,
          produktname: formData.produktname,
          kurzbeschreibung: formData.kurzbeschreibung,
          langtext: JSON.stringify(specifications),
          verkaufspreis: parseFloat(formData.verkaufspreis) || 0,
          zustand: formData.zustand,
          laenge_mm: parseInt(formData.laenge_mm) || null,
          breite_mm: parseInt(formData.breite_mm) || null,
          hoehe_mm: parseInt(formData.hoehe_mm) || null,
          gewicht_kg: parseFloat(formData.gewicht_kg) || null,
          location: formData.location,
          box_id: formData.box_id,
          auf_lager: parseInt(formData.auf_lager) || 1,
          hauptkategorie: formData.hauptkategorie,
          unterkategorie: formData.unterkategorie,
          kundenprofile: formData.kundenprofile,
          image: formData.image,
          publish: publish,
        }

        const response = await fetch('/api/admin/erfassung', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to save product')
        }

        const result = await response.json()
        setSavedItemUUID(result.item_uuid)
        setSavedProductId(result.product_id)
      }
    } catch (error) {
      logger.error('Error saving product', { error })
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get subcategories for selected main category
  const subcategories = KATEGORIEN.find(k => k.value === formData.hauptkategorie)?.subs || []

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

  if (savedItemUUID && savedProductId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Produkt erfasst!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Item UUID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{savedItemUUID}</code>
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <Link
              href={`/admin/products/${savedProductId}/factsheet`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Factsheet drucken
            </Link>
            <Link
              href="/admin/erfassung"
              onClick={() => {
                setSavedItemUUID(null)
                setSavedProductId(null)
                setFormData(DEFAULT_FORM_DATA)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Weiteres Produkt erfassen
            </Link>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Zur Produktübersicht
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-24 sm:pb-6">
      {/* Header - Compact on mobile */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/admin/products"
          className="p-2 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 sm:w-5 sm:h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
            {isEditMode ? 'Produkt bearbeiten' : 'Produkt Erfassung'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 hidden sm:block">
            {isEditMode ? 'Produktdaten aktualisieren' : 'Neues Produkt ins Inventar aufnehmen'}
          </p>
        </div>
      </div>

      {/* Data Entry Tabs (Speech / Picture / Form) */}
      <DataEntryTabs
        onProductData={handleProductData}
        onImageCapture={handleImageCapture}
        onError={(error) => logger.error('Data entry error', { error })}
      />

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">

        {/* Image Preview (if captured via Picture tab) */}
        {formData.image && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Produktbild
            </h2>
            <div className="flex items-start gap-4">
              <div className="relative">
                <Image
                  src={formData.image}
                  alt="Produktbild"
                  width={200}
                  height={150}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Grundinformationen
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Hersteller *</span>
                {aiMetadata.hersteller && (
                  <AIFieldIndicator source={aiMetadata.hersteller} fieldName="hersteller" />
                )}
              </label>
              <input
                type="text"
                value={formData.hersteller}
                onChange={(e) => handleChange('hersteller', e.target.value)}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                  aiMetadata.hersteller ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="z.B. Dell, HP, Lenovo"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Zustand *</span>
                {aiMetadata.zustand && (
                  <AIFieldIndicator source={aiMetadata.zustand} fieldName="zustand" />
                )}
              </label>
              <select
                value={formData.zustand}
                onChange={(e) => handleChange('zustand', e.target.value)}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                  aiMetadata.zustand ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                required
              >
                {ZUSTAND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Produktname / Modell *</span>
                {aiMetadata.produktname && (
                  <AIFieldIndicator source={aiMetadata.produktname} fieldName="produktname" />
                )}
              </label>
              <input
                type="text"
                value={formData.produktname}
                onChange={(e) => handleChange('produktname', e.target.value)}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                  aiMetadata.produktname ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="z.B. Latitude 7470"
                required
              />
            </div>

            {/* Price field moved up for mobile - most important after name */}
            <div className="md:hidden">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Verkaufspreis (CHF) *</span>
                {aiMetadata.verkaufspreis && (
                  <AIFieldIndicator source={aiMetadata.verkaufspreis} fieldName="verkaufspreis" />
                )}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.verkaufspreis}
                onChange={(e) => handleChange('verkaufspreis', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] text-xl font-semibold ${
                  aiMetadata.verkaufspreis ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0.00"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Kurzbeschreibung</span>
                {aiMetadata.kurzbeschreibung && (
                  <AIFieldIndicator source={aiMetadata.kurzbeschreibung} fieldName="kurzbeschreibung" />
                )}
              </label>
              <textarea
                value={formData.kurzbeschreibung}
                onChange={(e) => handleChange('kurzbeschreibung', e.target.value)}
                rows={2}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation ${
                  aiMetadata.kurzbeschreibung ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Kurze Beschreibung..."
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Kategorie</span>
                {aiMetadata.hauptkategorie && (
                  <AIFieldIndicator source={aiMetadata.hauptkategorie} fieldName="hauptkategorie" />
                )}
              </label>
              <select
                value={formData.hauptkategorie}
                onChange={(e) => handleKategorieChange(e.target.value)}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                  aiMetadata.hauptkategorie ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <option value="">Waehlen...</option>
                {KATEGORIEN.map(kat => (
                  <option key={kat.value} value={kat.value}>{kat.icon} {kat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span>Unterkategorie</span>
                {aiMetadata.unterkategorie && (
                  <AIFieldIndicator source={aiMetadata.unterkategorie} fieldName="unterkategorie" />
                )}
              </label>
              <select
                value={formData.unterkategorie}
                onChange={(e) => handleChange('unterkategorie', e.target.value)}
                className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                  aiMetadata.unterkategorie ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                }`}
                disabled={!formData.hauptkategorie}
              >
                <option value="">Waehlen...</option>
                {subcategories.map(sub => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Mobile: Collapsible Advanced Section Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="sm:hidden w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 touch-manipulation"
        >
          <span className="font-medium">Erweiterte Optionen</span>
          {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {/* Technical Specs - Hidden on mobile unless expanded */}
        <div className={`${showAdvanced ? 'block' : 'hidden'} sm:block`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Technische Daten</span>
                {aiMetadata.specs && (
                  <AIFieldIndicator source={aiMetadata.specs} fieldName="specs" />
                )}
              </h2>
              <button
                type="button"
                onClick={addSpecField}
                className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 touch-manipulation p-2 -m-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Feld hinzufuegen</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.specs.map((spec, index) => (
                <div key={index} className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                    className="w-1/3 px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-sm touch-manipulation"
                    placeholder="Eigenschaft"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                    className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-sm touch-manipulation"
                    placeholder="Wert"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecField(index)}
                    className="p-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg touch-manipulation min-w-[44px] flex items-center justify-center"
                    disabled={formData.specs.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Physical Dimensions & Inventory - Hidden on mobile unless expanded */}
        <div className={`${showAdvanced ? 'block' : 'hidden'} sm:block`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Dimensions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Abmessungen
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Länge (mm)</label>
                  <input
                    type="number"
                    value={formData.laenge_mm}
                    onChange={(e) => handleChange('laenge_mm', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Breite (mm)</label>
                  <input
                    type="number"
                    value={formData.breite_mm}
                    onChange={(e) => handleChange('breite_mm', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Höhe (mm)</label>
                  <input
                    type="number"
                    value={formData.hoehe_mm}
                    onChange={(e) => handleChange('hoehe_mm', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gewicht (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.gewicht_kg}
                    onChange={(e) => handleChange('gewicht_kg', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Lager & Preis
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {/* Desktop price - hidden on mobile since it's shown above */}
                <div className="hidden sm:block">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Verkaufspreis (CHF) *</span>
                    {aiMetadata.verkaufspreis && (
                      <AIFieldIndicator source={aiMetadata.verkaufspreis} fieldName="verkaufspreis" />
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.verkaufspreis}
                    onChange={(e) => handleChange('verkaufspreis', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 ${
                      aiMetadata.verkaufspreis ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Anzahl auf Lager</label>
                  <input
                    type="number"
                    value={formData.auf_lager}
                    onChange={(e) => handleChange('auf_lager', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Lagerort</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                    placeholder="S-B816-01-..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Box ID</label>
                  <input
                    type="text"
                    value={formData.box_id}
                    onChange={(e) => handleChange('box_id', e.target.value)}
                    className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                    placeholder="B-YYMMDD-NNNN"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Profiles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Geeignet für (Kundenprofile)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 sm:mb-4 hidden sm:block">
            Wähle die Zielgruppen, für die dieses Produkt geeignet ist. Hover für Details.
          </p>

          {Object.entries(getProfilesByCategory()).map(([categoryName, profiles]) => (
            <div key={categoryName} className="mb-4 last:mb-0">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {categoryName}
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-2">
                {profiles.map(profile => (
                  <button
                    key={profile.slug}
                    type="button"
                    onClick={() => toggleProfile(profile.slug)}
                    title={profile.description}
                    className={`group relative inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-2 rounded-full border-2 transition-colors touch-manipulation min-h-[44px] text-sm ${
                      formData.kundenprofile.includes(profile.slug)
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 active:bg-gray-100 dark:active:bg-gray-700'
                    }`}
                  >
                    <span className="text-lg sm:text-base">{profile.icon}</span>
                    <span>{profile.name_de}</span>
                    {/* Tooltip on hover - hidden on mobile */}
                    <span className="hidden sm:block invisible group-hover:visible absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 max-w-xs">
                      {profile.description}
                      <span className="absolute left-1/2 -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

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
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Speichere...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Als Entwurf speichern</>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  <Package className="w-5 h-5" />
                  Speichern & Veröffentlichen
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
          <div className="flex gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                const form = document.querySelector('form')
                if (form) form.requestSubmit()
              }}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Entwurf</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
              disabled={isLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-4 rounded-xl transition-colors touch-manipulation min-h-[52px]"
            >
              <Package className="w-5 h-5" />
              <span>Speichern</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
