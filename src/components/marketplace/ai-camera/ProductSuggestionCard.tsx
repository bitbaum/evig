"use client"

/**
 * Individual product suggestion card
 */

import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCategoryIcon, getConditionLabel } from './config'
import type { ProductSuggestion } from './types'

interface ProductSuggestionCardProps {
  suggestion: ProductSuggestion
  onSelect: (suggestion: ProductSuggestion) => void
}

export function ProductSuggestionCard({ suggestion, onSelect }: ProductSuggestionCardProps) {
  const IconComponent = getCategoryIcon(suggestion.category)

  return (
    <div
      onClick={() => onSelect(suggestion)}
      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-4">
        <IconComponent className="w-8 h-8 text-purple-600 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{suggestion.name}</h4>
            <ConfidenceBadge confidence={suggestion.confidence} />
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {suggestion.brand} • {getConditionLabel(suggestion.condition)} • CHF {suggestion.estimatedPrice}
          </p>
          <FeatureTags features={suggestion.features} />
        </div>
        <CheckCircle className="w-5 h-5 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <span className={cn(
      "px-2 py-1 text-xs rounded-full",
      confidence > 0.8 ? "bg-green-100 text-green-800" :
      confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
      "bg-red-100 text-red-800"
    )}>
      {Math.round(confidence * 100)}%
    </span>
  )
}

function FeatureTags({ features }: { features: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {features.slice(0, 3).map((feature, index) => (
        <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
          {feature}
        </span>
      ))}
    </div>
  )
}
