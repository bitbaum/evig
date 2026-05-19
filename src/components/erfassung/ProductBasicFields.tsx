'use client'

/**
 * ProductBasicFields
 *
 * Basic product information fields: manufacturer, condition, product name,
 * short description, category, subcategory, and mobile price field.
 */

import { Package } from 'lucide-react'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('components.erfassung.basicFields')

  return (
    <div className="card-shell p-6">
      <Heading level={2} className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        {t('title')}
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label htmlFor="basic-manufacturer" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('manufacturer')}</span>
            {aiMetadata.hersteller && (
              <AIFieldIndicator source={aiMetadata.hersteller} fieldName="hersteller" />
            )}
          </label>
          <input
            id="basic-manufacturer"
            type="text"
            value={formData.hersteller}
            onChange={(e) => onFieldChange('hersteller', e.target.value)}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
              aiMetadata.hersteller ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder={t('manufacturerPlaceholder')}
            required
          />
        </div>

        <div>
          <label htmlFor="basic-condition" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('condition')}</span>
            {aiMetadata.zustand && (
              <AIFieldIndicator source={aiMetadata.zustand} fieldName="zustand" />
            )}
          </label>
          <select
            id="basic-condition"
            value={formData.zustand}
            onChange={(e) => onFieldChange('zustand', e.target.value)}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
              aiMetadata.zustand ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            required
          >
            {ZUSTAND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="basic-product-name" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('productName')}</span>
            {aiMetadata.produktname && (
              <AIFieldIndicator source={aiMetadata.produktname} fieldName="produktname" />
            )}
          </label>
          <input
            id="basic-product-name"
            type="text"
            value={formData.produktname}
            onChange={(e) => onFieldChange('produktname', e.target.value)}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
              aiMetadata.produktname ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder={t('productNamePlaceholder')}
            required
          />
        </div>

        {/* Price field moved up for mobile */}
        <div className="md:hidden">
          <label htmlFor="basic-price" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('price')}</span>
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
            className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] text-xl font-semibold ${
              aiMetadata.verkaufspreis ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder={t('pricePlaceholder')}
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="basic-description" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('description')}</span>
            {aiMetadata.kurzbeschreibung && (
              <AIFieldIndicator source={aiMetadata.kurzbeschreibung} fieldName="kurzbeschreibung" />
            )}
          </label>
          <textarea
            id="basic-description"
            value={formData.kurzbeschreibung}
            onChange={(e) => onFieldChange('kurzbeschreibung', e.target.value)}
            rows={2}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation ${
              aiMetadata.kurzbeschreibung ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder={t('descriptionPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="basic-category" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('category')}</span>
            {aiMetadata.hauptkategorie && (
              <AIFieldIndicator source={aiMetadata.hauptkategorie} fieldName="hauptkategorie" />
            )}
          </label>
          <select
            id="basic-category"
            value={formData.hauptkategorie}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
              aiMetadata.hauptkategorie ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
          >
            <option value="">{t('categoryPlaceholder')}</option>
            {KATEGORIEN.map(kat => (
              <option key={kat.value} value={kat.value}>{kat.icon} {kat.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="basic-subcategory" className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
            <span>{t('subcategory')}</span>
            {aiMetadata.unterkategorie && (
              <AIFieldIndicator source={aiMetadata.unterkategorie} fieldName="unterkategorie" />
            )}
          </label>
          <select
            id="basic-subcategory"
            value={formData.unterkategorie}
            onChange={(e) => onFieldChange('unterkategorie', e.target.value)}
            className={`w-full px-4 py-3 sm:px-3 sm:py-2 border rounded-xl sm:rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 text-base touch-manipulation min-h-[48px] sm:min-h-0 ${
              aiMetadata.unterkategorie ? 'border-primary-300 dark:border-primary-600' : 'border-neutral-300 dark:border-neutral-600'
            }`}
            disabled={!formData.hauptkategorie}
          >
            <option value="">{t('categoryPlaceholder')}</option>
            {subcategories.map(sub => (
              <option key={sub.value} value={sub.value}>{sub.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
