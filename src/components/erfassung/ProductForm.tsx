'use client'

/**
 * ProductForm Component
 *
 * Reusable product form used by:
 * - Erfassung page (single mode)
 * - BulkDetailPanel (bulk mode, for editing individual products)
 *
 * Renders all product fields: image, basic info, specs, dimensions, inventory, profiles.
 */

import Image from 'next/image'
import {
  Plus,
  Trash2,
  Camera,
  Package,
  Ruler,
  MapPin,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { AIFieldIndicator } from '@/components/ai/AIFieldIndicator'
import type { ErfassungFormData, AIFieldMetadata, SpecField } from '@/types/erfassung'
import {
  ZUSTAND_OPTIONS,
  KATEGORIEN,
  SPEC_TEMPLATES,
  getProfilesByCategory,
} from '@/config/erfassung'

interface ProductFormProps {
  formData: ErfassungFormData
  aiMetadata: AIFieldMetadata
  showAdvanced: boolean
  isEditMode: boolean
  onFieldChange: (field: keyof ErfassungFormData, value: string | string[]) => void
  onSpecChange: (index: number, field: 'key' | 'value', value: string) => void
  onCategoryChange: (kategorie: string) => void
  onProfileToggle: (slug: string) => void
  onSpecAdd: () => void
  onSpecRemove: (index: number) => void
  onImageChange: (image: string | null) => void
  onToggleAdvanced: () => void
}

export function ProductForm({
  formData,
  aiMetadata,
  showAdvanced,
  isEditMode,
  onFieldChange,
  onSpecChange,
  onCategoryChange,
  onProfileToggle,
  onSpecAdd,
  onSpecRemove,
  onImageChange,
  onToggleAdvanced,
}: ProductFormProps) {
  // Get subcategories for selected main category
  const subcategories = KATEGORIEN.find(k => k.value === formData.hauptkategorie)?.subs || []

  return (
    <>
      {/* Produktbild Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Produktbild
        </h2>
        <div className="flex items-start gap-4">
          {formData.image ? (
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
                onClick={() => onImageChange(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center"
              >
                <span className="text-xs font-bold">X</span>
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-48 h-36 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Bild hochladen</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">oder hierher ziehen</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const base64 = event.target?.result as string
                      onImageChange(base64)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </label>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          JPG, PNG oder WebP. Max 5 MB.
        </p>
      </div>

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
              onChange={(e) => onFieldChange('hersteller', e.target.value)}
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
              onChange={(e) => onFieldChange('zustand', e.target.value)}
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
              onChange={(e) => onFieldChange('produktname', e.target.value)}
              className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                aiMetadata.produktname ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="z.B. Latitude 7470"
              required
            />
          </div>

          {/* Price field moved up for mobile */}
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
              onChange={(e) => onFieldChange('verkaufspreis', e.target.value)}
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
              onChange={(e) => onFieldChange('kurzbeschreibung', e.target.value)}
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
              onChange={(e) => onCategoryChange(e.target.value)}
              className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                aiMetadata.hauptkategorie ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <option value="">Wählen...</option>
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
              onChange={(e) => onFieldChange('unterkategorie', e.target.value)}
              className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
                aiMetadata.unterkategorie ? 'border-purple-300 dark:border-purple-600' : 'border-gray-300 dark:border-gray-600'
              }`}
              disabled={!formData.hauptkategorie}
            >
              <option value="">Wählen...</option>
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
        onClick={onToggleAdvanced}
        className="sm:hidden w-full flex items-center justify-between px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-300 touch-manipulation"
      >
        <span className="font-medium">Erweiterte Optionen</span>
        {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {/* Technical Specs */}
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
              onClick={onSpecAdd}
              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 touch-manipulation p-2 -m-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Feld hinzufügen</span>
            </button>
          </div>

          <div className="space-y-3">
            {formData.specs.map((spec, index) => (
              <div key={index} className="flex gap-2 sm:gap-3">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => onSpecChange(index, 'key', e.target.value)}
                  className="w-1/3 px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-sm touch-manipulation"
                  placeholder="Eigenschaft"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => onSpecChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 text-sm touch-manipulation"
                  placeholder="Wert"
                />
                <button
                  type="button"
                  onClick={() => onSpecRemove(index)}
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

      {/* Physical Dimensions & Inventory */}
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
                  onChange={(e) => onFieldChange('laenge_mm', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Breite (mm)</label>
                <input
                  type="number"
                  value={formData.breite_mm}
                  onChange={(e) => onFieldChange('breite_mm', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Höhe (mm)</label>
                <input
                  type="number"
                  value={formData.hoehe_mm}
                  onChange={(e) => onFieldChange('hoehe_mm', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gewicht (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gewicht_kg}
                  onChange={(e) => onFieldChange('gewicht_kg', e.target.value)}
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
              {/* Desktop price */}
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
                  onChange={(e) => onFieldChange('verkaufspreis', e.target.value)}
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
                  onChange={(e) => onFieldChange('auf_lager', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Lagerort</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => onFieldChange('location', e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
                  placeholder="S-B816-01-..."
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Box ID</label>
                <input
                  type="text"
                  value={formData.box_id}
                  onChange={(e) => onFieldChange('box_id', e.target.value)}
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
                  onClick={() => onProfileToggle(profile.slug)}
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
    </>
  )
}
