'use client'

/**
 * ProductDimensionFields
 *
 * Physical dimensions (length, width, height, weight) and
 * inventory/price fields (price desktop, stock, location, box ID).
 */

import { Ruler, MapPin } from 'lucide-react'
import { AIFieldIndicator } from '@/components/ai/AIFieldIndicator'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'

interface ProductDimensionFieldsProps {
  formData: ErfassungFormData
  aiMetadata: AIFieldMetadata
  onFieldChange: (field: keyof ErfassungFormData, value: string | string[]) => void
}

export function ProductDimensionFields({
  formData,
  aiMetadata,
  onFieldChange,
}: ProductDimensionFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Dimensions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5" />
          Abmessungen
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dimension-length" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Länge (mm)</label>
            <input
              id="dimension-length"
              type="number"
              value={formData.laenge_mm}
              onChange={(e) => onFieldChange('laenge_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-width" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Breite (mm)</label>
            <input
              id="dimension-width"
              type="number"
              value={formData.breite_mm}
              onChange={(e) => onFieldChange('breite_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-height" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Höhe (mm)</label>
            <input
              id="dimension-height"
              type="number"
              value={formData.hoehe_mm}
              onChange={(e) => onFieldChange('hoehe_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-weight" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Gewicht (kg)</label>
            <input
              id="dimension-weight"
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
            <label htmlFor="dimension-price" className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span>Verkaufspreis (CHF) *</span>
              {aiMetadata.verkaufspreis && (
                <AIFieldIndicator source={aiMetadata.verkaufspreis} fieldName="verkaufspreis" />
              )}
            </label>
            <input
              id="dimension-price"
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
            <label htmlFor="dimension-stock" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Anzahl auf Lager</label>
            <input
              id="dimension-stock"
              type="number"
              value={formData.auf_lager}
              onChange={(e) => onFieldChange('auf_lager', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-location" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Lagerort</label>
            <input
              id="dimension-location"
              type="text"
              value={formData.location}
              onChange={(e) => onFieldChange('location', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 touch-manipulation"
              placeholder="S-B816-01-..."
            />
          </div>
          <div>
            <label htmlFor="dimension-box-id" className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Box ID</label>
            <input
              id="dimension-box-id"
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
  )
}
