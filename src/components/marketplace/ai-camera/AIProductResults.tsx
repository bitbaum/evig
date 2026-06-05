"use client"

/**
 * AI analysis results with product suggestions
 */

import { ProductSuggestionCard } from './ProductSuggestionCard'
import type { ProductSuggestion } from './types'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

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
        <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
          Produkt-Erkennung abgeschlossen!
        </Heading>
        <p className="text-text-secondary">
          Wähle das erkannte Produkt aus oder versuche es mit einem besseren Foto erneut
        </p>
      </div>

      {/* Captured Image Preview */}
      <div className="flex justify-center mb-6">
        <img
          src={capturedImage}
          alt="Captured product"
          className="w-32 h-32 object-cover rounded-lg border"
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
      <div className="flex gap-3 pt-4 border-t border">
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="flex-1"
        >
          Neues Foto
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
        >
          Manueller Eintrag
        </Button>
      </div>
    </div>
  )
}
