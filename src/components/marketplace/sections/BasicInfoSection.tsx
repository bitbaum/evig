/**
 * BasicInfoSection Component
 * 
 * Form section for basic product information
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

import { DollarSign } from 'lucide-react'
import { ProductFormData, ProductListingErrors } from '../types'
import { PRODUCT_CATEGORIES } from '../constants'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'

interface BasicInfoSectionProps {
  formData: ProductFormData
  errors: ProductListingErrors
  onFieldChange: (field: keyof ProductFormData, value: string) => void
}

export function BasicInfoSection({ formData, errors, onFieldChange }: BasicInfoSectionProps) {
  return (
    <div className="space-y-6">
      <h3 className={cn('text-lg font-medium', getTextColor('white', 'primary'))}>
        Grundinformationen
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
            Produkt-Titel *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => onFieldChange('title', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
              errors.title ? "border-error-300" : "border-neutral-300"
            )}
            placeholder="z.B. Dell Latitude E7470 Laptop"
          />
          {errors.title && (
            <p className="text-error-600 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
            Preis (CHF) *
          </label>
          <div className="relative">
            <DollarSign className="w-5 h-5 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => onFieldChange('price', e.target.value)}
              className={cn(
                "w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
                errors.price ? "border-error-300" : "border-neutral-300"
              )}
              placeholder="599.00"
            />
          </div>
          {errors.price && (
            <p className="text-error-600 text-sm mt-1">{errors.price}</p>
          )}
        </div>
      </div>

      <div>
        <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
          Beschreibung *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onFieldChange('description', e.target.value)}
          rows={4}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
            errors.description ? "border-error-300" : "border-neutral-300"
          )}
          placeholder="Beschreiben Sie den Zustand, Ausstattung, eventuelle Mängel und alle wichtigen Details..."
        />
        {errors.description && (
          <p className="text-error-600 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
            Kategorie *
          </label>
          <select
            value={formData.category}
            onChange={(e) => onFieldChange('category', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
              errors.category ? "border-error-300" : "border-neutral-300"
            )}
          >
            <option value="">Kategorie wählen</option>
            {PRODUCT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-error-600 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
            Marke
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e) => onFieldChange('brand', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="z.B. Dell, Apple, Lenovo"
          />
        </div>

        <div>
          <label className={cn('block text-sm font-medium mb-2', getTextColor('white', 'secondary'))}>
            Standort *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => onFieldChange('location', e.target.value)}
            className={cn(
              "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
              errors.location ? "border-error-300" : "border-neutral-300"
            )}
            placeholder="z.B. Zürich, Bern, Basel"
          />
          {errors.location && (
            <p className="text-error-600 text-sm mt-1">{errors.location}</p>
          )}
        </div>
      </div>
    </div>
  )
}



