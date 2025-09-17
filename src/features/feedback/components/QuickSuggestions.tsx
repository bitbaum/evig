/**
 * QuickSuggestions Component
 * @fileoverview Quick suggestion buttons component for better modularity
 */

import { cn } from '@/lib/utils'
import { CONTEXTUAL_SUGGESTIONS, FeedbackScope, SelectedElement, SCOPE_CONFIG } from '../types'

interface QuickSuggestionsProps {
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  onQuickSuggestion: (suggestion: string) => void
}

export function QuickSuggestions({
  feedbackScope,
  selectedElements,
  onQuickSuggestion
}: QuickSuggestionsProps) {
  const suggestions = feedbackScope === 'element'
    ? CONTEXTUAL_SUGGESTIONS.element(selectedElements.length)
    : CONTEXTUAL_SUGGESTIONS[feedbackScope] || []

  const scopeConfig = SCOPE_CONFIG[feedbackScope]

  return (
    <div className="mb-2">
      <h4 className="text-xs font-medium text-gray-700 mb-1">
        {feedbackScope === 'element' && selectedElements.length === 0
          ? 'Element auswählen'
          : 'Schnelle Ideen'
        }:
      </h4>
      <div className="grid grid-cols-2 gap-0.5">
        {suggestions.map((suggestion, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onQuickSuggestion(suggestion)}
            className={cn(
              "text-left py-1 px-1.5 text-xs bg-gray-50 border border-gray-200 rounded transition-colors truncate",
              feedbackScope === 'site' && "hover:bg-purple-50 hover:border-purple-300",
              feedbackScope === 'page' && "hover:bg-green-50 hover:border-green-300",
              feedbackScope === 'element' && "hover:bg-blue-50 hover:border-blue-300"
            )}
            disabled={feedbackScope === 'element' && selectedElements.length === 0}
            title={suggestion}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}