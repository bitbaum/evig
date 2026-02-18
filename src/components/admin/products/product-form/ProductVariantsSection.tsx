'use client'

import { Plus, Minus } from 'lucide-react'
import type { ProductVariant } from './types'

interface Props {
  variants: ProductVariant[]
  onVariantChange: (index: number, field: string, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
}

export function ProductVariantsSection({ variants, onVariantChange, onAdd, onRemove }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Produktvarianten</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Variante hinzufügen
        </button>
      </div>

      <div className="space-y-4">
        {variants.map((variant, index) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Variante {index + 1}</h3>
              {variants.length > 1 && (
                <button type="button" onClick={() => onRemove(index)} className="text-red-600 hover:text-red-700">
                  <Minus className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titel</label>
                <input
                  type="text"
                  value={variant.title}
                  onChange={(e) => onVariantChange(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="z.B. 16GB RAM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => onVariantChange(index, 'sku', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="MBP14-16GB"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preis (CHF)</label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.price}
                  onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="1299.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lager</label>
                <input
                  type="number"
                  value={variant.inventory}
                  onChange={(e) => onVariantChange(index, 'inventory', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
