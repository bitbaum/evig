'use client'

/**
 * ProductBasicFields
 *
 * Basic product information fields: manufacturer, condition, product name,
 * short description, category, subcategory, and mobile price field.
 */

import { Package } from 'lucide-react'
import { AIFieldIndicator } from '@/components/ai/AIFieldIndicator'
import Heading from '@/components/ui/Heading'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'
import { ZUSTAND_OPTIONS, KATEGORIEN } from '@/config/erfassung'

interface ProductBasicFieldsProps {
  formData: ErfassungFormData
  aiMetadata: AIFieldMetadata
  subcategories: { value: string; label: string }[]
  onFieldChange: (field: keyof ErfassungFormData, value: string | string[]) => void
  onCategoryChange: (kategorie: string) => void
}

export function ProductBasicFields({
  formData,
  aiMetadata,
  subcategories,
  onFieldChange,
  onCategoryChange,
}: ProductBasicFieldsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Grundinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="basic-manufacturer" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Hersteller *</span>
            {aiMetadata.hersteller && (
              <AIFieldIndicator source={aiMetadata.hersteller} fieldName="hersteller" />
            )}
          </label>
          <input
            id="basic-manufacturer"
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
          <label htmlFor="basic-condition" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Zustand *</span>
            {aiMetadata.zustand && (
              <AIFieldIndicator source={aiMetadata.zustand} fieldName="zustand" />
            )}
          </label>
          <select
            id="basic-condition"
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
          <label htmlFor="basic-product-name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Produktname / Modell *</span>
            {aiMetadata.produktname && (
              <AIFieldIndicator source={aiMetadata.produktname} fieldName="produktname" />
            )}
          </label>
          <input
            id="basic-product-name"
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
          <label htmlFor="basic-price" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Verkaufspreis (CHF) *</span>
            {aiMetadata.verkaufspreis && (
              <AIFieldIndicator source={aiMetadata.verkaufspreis} fieldName="verkaufspreis" />
            )}
          </label>
          <input
            id="basic-price"
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
          <label htmlFor="basic-description" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Kurzbeschreibung</span>
            {aiMetadata.kurzbeschreibung && (
              <AIFieldIndicator source={aiMetadata.kurzbeschreibung} fieldName="kurzbeschreibung" />
            )}
          </label>
          <textarea
            id="basic-description"
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
          <label htmlFor="basic-category" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Kategorie</span>
            {aiMetadata.hauptkategorie && (
              <AIFieldIndicator source={aiMetadata.hauptkategorie} fieldName="hauptkategorie" />
            )}
          </label>
          <select
            id="basic-category"
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
          <label htmlFor="basic-subcategory" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            <span>Unterkategorie</span>
            {aiMetadata.unterkategorie && (
              <AIFieldIndicator source={aiMetadata.unterkategorie} fieldName="unterkategorie" />
            )}
          </label>
          <select
            id="basic-subcategory"
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
  )
}
