'use client'

/**
 * ProductForm Component
 *
 * Thin orchestrator that composes section components into the full product form.
 *
 * Used by:
 * - Erfassung page (single mode)
 * - BulkDetailPanel (bulk mode, for editing individual products)
 */

import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ErfassungFormData, AIFieldMetadata } from '@/types/erfassung'
import { Button } from '@/components/ui/button'
import { KATEGORIEN } from '@/config/erfassung'
import { ProductImageSection } from './ProductImageSection'
import { ProductBasicFields } from './ProductBasicFields'
import { ProductSpecFields } from './ProductSpecFields'
import { ProductDimensionFields } from './ProductDimensionFields'
import { ProductProfileFields } from './ProductProfileFields'

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
  const subcategories = KATEGORIEN.find(k => k.value === formData.hauptkategorie)?.subs || []

  return (
    <>
      <ProductImageSection
        image={formData.image}
        onImageChange={onImageChange}
      />

      <ProductBasicFields
        formData={formData}
        aiMetadata={aiMetadata}
        subcategories={subcategories}
        onFieldChange={onFieldChange}
        onCategoryChange={onCategoryChange}
      />

      {/* Mobile: Collapsible Advanced Section Toggle */}
      <Button
        type="button"
        variant="ghost"
        onClick={onToggleAdvanced}
        className="sm:hidden w-full flex items-center justify-between px-4 py-3 bg-surface-raised rounded-xl text-text-secondary touch-manipulation h-auto"
      >
        <span className="font-medium">Erweiterte Optionen</span>
        {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </Button>

      {/* Technical Specs */}
      <div className={`${showAdvanced ? 'block' : 'hidden'} sm:block`}>
        <ProductSpecFields
          specs={formData.specs}
          aiMetadata={aiMetadata}
          onSpecChange={onSpecChange}
          onSpecAdd={onSpecAdd}
          onSpecRemove={onSpecRemove}
        />
      </div>

      {/* Physical Dimensions & Inventory */}
      <div className={`${showAdvanced ? 'block' : 'hidden'} sm:block`}>
        <ProductDimensionFields
          formData={formData}
          aiMetadata={aiMetadata}
          onFieldChange={onFieldChange}
        />
      </div>

      <ProductProfileFields
        kundenprofile={formData.kundenprofile}
        onProfileToggle={onProfileToggle}
      />
    </>
  )
}
