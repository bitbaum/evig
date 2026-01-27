'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { DataEntryTabs } from '@/components/erfassung/DataEntryTabs'
import type { ErfassungFormData } from '@/types/erfassung'
import { DEFAULT_FORM_DATA } from '@/types/erfassung'
import {
  CUSTOMER_PROFILES,
  ZUSTAND_OPTIONS,
  KATEGORIEN,
  SPEC_TEMPLATES,
} from '@/config/erfassung'

export default function ErfassungPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [savedItemUUID, setSavedItemUUID] = useState<string | null>(null)
  const [savedProductId, setSavedProductId] = useState<string | null>(null)

  const [formData, setFormData] = useState<ErfassungFormData>(DEFAULT_FORM_DATA)

  // Handle basic field changes
  const handleChange = (field: keyof ErfassungFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
  const handleProductData = useCallback((data: Partial<ErfassungFormData>) => {
    logger.info('Product data received', { product: data.produktname })

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
      // Build Langtext JSON from specs
      const langtext: Record<string, string> = {}
      formData.specs.forEach(spec => {
        if (spec.key && spec.value) {
          langtext[spec.key] = spec.value
        }
      })

      const payload = {
        hersteller: formData.hersteller,
        produktname: formData.produktname,
        kurzbeschreibung: formData.kurzbeschreibung,
        langtext: JSON.stringify(langtext),
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

    } catch (error) {
      logger.error('Error saving product', { error })
      alert('Fehler beim Speichern. Bitte erneut versuchen.')
    } finally {
      setIsLoading(false)
    }
  }

  // Get subcategories for selected main category
  const subcategories = KATEGORIEN.find(k => k.value === formData.hauptkategorie)?.subs || []

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Produkt Erfassung
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Neues Produkt ins Inventar aufnehmen
            </p>
          </div>
        </div>

        <Link
          href="/inventory/ai-capture"
          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700"
        >
          <Camera className="w-4 h-4" />
          KI-Erfassung
        </Link>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hersteller *
              </label>
              <input
                type="text"
                value={formData.hersteller}
                onChange={(e) => handleChange('hersteller', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="z.B. Dell, HP, Lenovo"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Zustand *
              </label>
              <select
                value={formData.zustand}
                onChange={(e) => handleChange('zustand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                required
              >
                {ZUSTAND_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Produktname / Modell *
              </label>
              <input
                type="text"
                value={formData.produktname}
                onChange={(e) => handleChange('produktname', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="z.B. Latitude 7470 (Intel i5-6300U, 8GB RAM, 256GB SSD)"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kurzbeschreibung
              </label>
              <textarea
                value={formData.kurzbeschreibung}
                onChange={(e) => handleChange('kurzbeschreibung', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                placeholder="Kurze Beschreibung für Kunden..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hauptkategorie
              </label>
              <select
                value={formData.hauptkategorie}
                onChange={(e) => handleKategorieChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="">Kategorie wählen</option>
                {KATEGORIEN.map(kat => (
                  <option key={kat.value} value={kat.value}>{kat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unterkategorie
              </label>
              <select
                value={formData.unterkategorie}
                onChange={(e) => handleChange('unterkategorie', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                disabled={!formData.hauptkategorie}
              >
                <option value="">Unterkategorie wählen</option>
                {subcategories.map(sub => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Technische Daten
            </h2>
            <button
              type="button"
              onClick={addSpecField}
              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <Plus className="w-4 h-4" />
              Feld hinzufügen
            </button>
          </div>

          <div className="space-y-3">
            {formData.specs.map((spec, index) => (
              <div key={index} className="flex gap-3">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => handleSpecChange(index, 'key', e.target.value)}
                  className="w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="Eigenschaft"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleSpecChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="Wert"
                />
                <button
                  type="button"
                  onClick={() => removeSpecField(index)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  disabled={formData.specs.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Dimensions & Inventory */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dimensions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Breite (mm)</label>
                <input
                  type="number"
                  value={formData.breite_mm}
                  onChange={(e) => handleChange('breite_mm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Höhe (mm)</label>
                <input
                  type="number"
                  value={formData.hoehe_mm}
                  onChange={(e) => handleChange('hoehe_mm', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gewicht_kg}
                  onChange={(e) => handleChange('gewicht_kg', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Lager & Preis
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Verkaufspreis (CHF) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.verkaufspreis}
                  onChange={(e) => handleChange('verkaufspreis', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Anzahl auf Lager</label>
                <input
                  type="number"
                  value={formData.auf_lager}
                  onChange={(e) => handleChange('auf_lager', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Lagerort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="S-B816-01-..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Box ID</label>
                <input
                  type="text"
                  value={formData.box_id}
                  onChange={(e) => handleChange('box_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  placeholder="B-YYMMDD-NNNN"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Customer Profiles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Geeignet für (Kundenprofile)
          </h2>

          <div className="flex flex-wrap gap-3">
            {CUSTOMER_PROFILES.map(profile => (
              <button
                key={profile.slug}
                type="button"
                onClick={() => toggleProfile(profile.slug)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-colors ${
                  formData.kundenprofile.includes(profile.slug)
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <span>{profile.icon}</span>
                <span>{profile.name_de}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-between items-center pt-4">
          <Link
            href="/admin/products"
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            Abbrechen
          </Link>

          <div className="flex gap-3">
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
          </div>
        </div>
      </form>
    </div>
  )
}
