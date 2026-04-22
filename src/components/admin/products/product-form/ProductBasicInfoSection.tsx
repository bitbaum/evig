'use client'

import type { ProductFormData } from './types'
import { PRODUCT_CATEGORIES } from './types'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  formData: ProductFormData
  onInputChange: (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => void
}

export function ProductBasicInfoSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-6">Grundinformationen</Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produktname *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Refurbished MacBook Pro 14"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL-Slug *</label>
          <input
            type="text"
            value={formData.handle}
            onChange={(e) => onInputChange('handle', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="dell-latitude-e7470"
            required
            aria-required="true"
          />
          {formData.handle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              URL: /products/{formData.handle}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategorie</label>
          <select
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">Kategorie wählen</option>
            {PRODUCT_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Beschreibung</label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Detaillierte Beschreibung des Produkts..."
          />
        </div>
      </div>
    </div>
  )
}
