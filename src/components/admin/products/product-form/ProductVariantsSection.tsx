'use client'

import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Heading from '@/components/admin/AdminHeading'
import type { ProductVariant } from './types'

interface Props {
  variants: ProductVariant[]
  onVariantChange: (index: number, field: string, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ProductVariantsSection({ variants, onVariantChange, onAdd, onRemove }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <Heading level={2} className="text-lg text-neutral-900 dark:text-white">Produktvarianten</Heading>
        <Button
          type="button"
          onClick={onAdd}
          size="sm"
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Variante hinzufügen
        </Button>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={index} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Heading level={3} className="text-neutral-900 dark:text-white">Variante {index + 1}</Heading>
              {variants.length > 1 && (
                <button type="button" onClick={() => onRemove(index)} className="text-error-600 hover:text-error-700">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Titel</label>
                <input
                  type="text"
                  value={variant.title}
                  onChange={(e) => onVariantChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="z.B. 16GB RAM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => onVariantChange(index, 'sku', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="MBP14-16GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Preis (CHF)</label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1299.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Lager</label>
                <input
                  type="number"
                  value={variant.inventory}
                  onChange={(e) => onVariantChange(index, 'inventory', e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
