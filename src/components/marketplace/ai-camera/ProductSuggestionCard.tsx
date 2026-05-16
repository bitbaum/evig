"use client"

/**
 * Individual product suggestion card
 */

import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON, getConditionLabel } from './config'
import type { ProductSuggestion } from './types'

interface ProductSuggestionCardProps {
  suggestion: ProductSuggestion
  onSelect: (suggestion: ProductSuggestion) => void
}

// Render icon outside of component to avoid "creating component during render"
function CategoryIcon({ category, className }: { category: string; className: string }) {
  const IconComponent = CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON
  return <IconComponent className={className} />
}

export function ProductSuggestionCard({ suggestion, onSelect }: ProductSuggestionCardProps) {
  return (
    <div
      onClick={() => onSelect(suggestion)}
      className="p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
    >
      <div className="flex items-start gap-4">
        <CategoryIcon category={suggestion.category} className="w-8 h-8 text-primary-600 mt-1" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Heading level={4} className="font-medium text-neutral-900">{suggestion.name}</Heading>
            <ConfidenceBadge confidence={suggestion.confidence} />
          </div>
          <p className="text-sm text-neutral-600 mb-2">
            {suggestion.brand} • {getConditionLabel(suggestion.condition)} • CHF {suggestion.estimatedPrice}
          </p>
          <FeatureTags features={suggestion.features} />
        </div>
        <CheckCircle className="w-5 h-5 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  return (
    <span className={cn(
      "px-2 py-1 text-xs rounded-full",
      confidence > 0.8 ? "bg-primary-100 text-primary-800" :
      confidence > 0.6 ? "bg-warning-100 text-warning-800" :
      "bg-error-100 text-error-800"
    )}>
      {Math.round(confidence * 100)}%
    </span>
  )
}

function FeatureTags({ features }: { features: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {features.slice(0, 3).map((feature, index) => (
        <span key={index} className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded">
          {feature}
        </span>
      ))}
    </div>
  )
}
