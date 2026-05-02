/**
 * ConditionSection Component
 * 
 * Form section for product condition selection
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted from ProductListingForm
 */

import { CheckCircle } from 'lucide-react'
import { ProductFormData, ProductListingErrors } from '../types'
import { PRODUCT_CONDITIONS } from '../constants'
import { cn } from '@/lib/utils'
import { getTextColor, getStatusColors } from '@/lib/design-system'

interface ConditionSectionProps {
  formData: ProductFormData
  errors: ProductListingErrors
  onConditionChange: (value: string) => void
}

export function ConditionSection({ formData, errors, onConditionChange }: ConditionSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className={cn('text-lg font-medium', getTextColor('white', 'primary'))}>
        Zustand *
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCT_CONDITIONS.map((condition) => {
          const isSelected = formData.condition === condition.value
          const selectedColors = getStatusColors('info')
          
          return (
            <label
              key={condition.value}
              className={cn(
                "relative flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors min-h-[touch] touch-target",
                isSelected
                  ? `${selectedColors.border} ${selectedColors.bg}`
                  : "border-neutral-200 hover:border-neutral-300"
              )}
            >
              <input
                type="radio"
                name="condition"
                value={condition.value}
                checked={isSelected}
                onChange={(e) => onConditionChange(e.target.value)}
                className="sr-only"
              />
              <div className="flex-1">
                <div className={cn('font-medium', getTextColor('white', 'primary'))}>
                  {condition.label}
                </div>
                <div className={cn('text-sm', getTextColor('white', 'muted'))}>
                  {condition.description}
                </div>
              </div>
              {isSelected && (
                <CheckCircle className={cn('w-5 h-5 flex-shrink-0', selectedColors.icon)} />
              )}
            </label>
          )
        })}
      </div>
      {errors.condition && (
        <p className="text-error-600 text-sm">{errors.condition}</p>
      )}
    </div>
  )
}



