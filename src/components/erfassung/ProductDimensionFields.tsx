'use client'

/**
 * ProductDimensionFields
 *
 * Physical dimensions (length, width, height, weight) and
 * inventory/price fields (price desktop, stock, location, box ID).
 */

import { Ruler, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AIFieldIndicator } from '@/components/ai/AIFieldIndicator'
import Heading from '@/components/ui/Heading'
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
  const t = useTranslations('components.erfassung.dimensionFields')

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      {/* Dimensions */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-4 sm:p-6">
        <Heading level={2} className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <Ruler className="w-5 h-5" />
          {t('dimensionsTitle')}
        </Heading>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dimension-length" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('length')}</label>
            <input
              id="dimension-length"
              type="number"
              value={formData.laenge_mm}
              onChange={(e) => onFieldChange('laenge_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-width" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('width')}</label>
            <input
              id="dimension-width"
              type="number"
              value={formData.breite_mm}
              onChange={(e) => onFieldChange('breite_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-height" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('height')}</label>
            <input
              id="dimension-height"
              type="number"
              value={formData.hoehe_mm}
              onChange={(e) => onFieldChange('hoehe_mm', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-weight" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('weight')}</label>
            <input
              id="dimension-weight"
              type="number"
              step="0.01"
              value={formData.gewicht_kg}
              onChange={(e) => onFieldChange('gewicht_kg', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-4 sm:p-6">
        <Heading level={2} className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          {t('stockTitle')}
        </Heading>

        <div className="grid grid-cols-2 gap-3">
          {/* Desktop price */}
          <div className="hidden sm:block">
            <label htmlFor="dimension-price" className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-1">
              <span>{t('price')}</span>
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
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 ${
                aiMetadata.verkaufspreis ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
              }`}
              required
            />
          </div>
          <div>
            <label htmlFor="dimension-stock" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('stock')}</label>
            <input
              id="dimension-stock"
              type="number"
              value={formData.auf_lager}
              onChange={(e) => onFieldChange('auf_lager', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
            />
          </div>
          <div>
            <label htmlFor="dimension-location" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('location')}</label>
            <input
              id="dimension-location"
              type="text"
              value={formData.location}
              onChange={(e) => onFieldChange('location', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
              placeholder={t('locationPlaceholder')}
            />
          </div>
          <div>
            <label htmlFor="dimension-box-id" className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">{t('boxId')}</label>
            <input
              id="dimension-box-id"
              type="text"
              value={formData.box_id}
              onChange={(e) => onFieldChange('box_id', e.target.value)}
              className="w-full px-3 py-2.5 sm:py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 touch-manipulation"
              placeholder={t('boxIdPlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
