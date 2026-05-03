'use client'

import { cn } from '@/lib/utils'
import { SCOPE_CONFIG, getQuickSuggestions } from '../config/scope-config'
import type { FeedbackScope, SelectedElement } from '../types'

interface QuickSuggestionsProps {
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  onSuggestionClick: (suggestion: string) => void
}

export function QuickSuggestions({ feedbackScope, selectedElements, onSuggestionClick }: QuickSuggestionsProps) {
  const suggestions = getQuickSuggestions(feedbackScope, selectedElements.length)
  const config = SCOPE_CONFIG[feedbackScope]

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-neutral-700">
        Schnellvorschläge
      </label>
      <div className="grid grid-cols-2 gap-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              "px-2 py-1 text-xs rounded border transition-colors text-left",
              `${config.hoverBg} ${config.borderColor} hover:${config.textColor}`
            )}
            disabled={feedbackScope === 'element' && selectedElements.length === 0 && suggestion !== "Element auswählen"}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
