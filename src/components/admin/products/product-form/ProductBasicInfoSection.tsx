'use client'

import type { ProductFormData } from './types'
import { PRODUCT_CATEGORIES } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface Props {
  formData: ProductFormData
  onInputChange: (field: keyof ProductFormData, value: ProductFormData[keyof ProductFormData]) => void
}

export function ProductBasicInfoSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-white/[0.06] p-6">
      <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-6">Grundinformationen</Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Produktname" required className="md:col-span-2">
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="z.B. Refurbished MacBook Pro 14"
            required
            aria-required="true"
          />
        </FormField>

        <FormField
          label="URL-Slug"
          required
          hint={formData.handle ? `URL: /products/${formData.handle}` : undefined}
        >
          <Input
            type="text"
            value={formData.handle}
            onChange={(e) => onInputChange('handle', e.target.value)}
            placeholder="dell-latitude-e7470"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Kategorie">
          <Select
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
          >
            <option value="">Kategorie wählen</option>
            {PRODUCT_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Beschreibung" className="md:col-span-2">
          <Textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={4}
            placeholder="Detaillierte Beschreibung des Produkts..."
          />
        </FormField>
      </div>
    </div>
  )
}
