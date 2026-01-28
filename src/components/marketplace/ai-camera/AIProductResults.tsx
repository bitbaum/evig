"use client"

/**
 * AI analysis results with product suggestions
 */

import { ProductSuggestionCard } from './ProductSuggestionCard'
import type { ProductSuggestion } from './types'

interface AIProductResultsProps {
  capturedImage: string
  suggestions: ProductSuggestion[]
  onSelectProduct: (suggestion: ProductSuggestion) => void
  onRetry: () => void
  onClose: () => void
}

export function AIProductResults({
  capturedImage,
  suggestions,
  onSelectProduct,
  onRetry,
  onClose
}: AIProductResultsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Produkt-Erkennung abgeschlossen!
        </h3>
        <p className="text-gray-600">
          Wählen Sie das erkannte Produkt aus oder versuchen Sie es mit einem besseren Foto erneut
        </p>
      </div>

      {/* Captured Image Preview */}
      <div className="flex justify-center mb-6">
        <img
          src={capturedImage}
          alt="Captured product"
          className="w-32 h-32 object-cover rounded-lg border border-gray-200"
        />
      </div>

      {/* Product Suggestions */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <ProductSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onSelect={onSelectProduct}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onRetry}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Neues Foto
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Manueller Eintrag
        </button>
      </div>
    </div>
  )
}
