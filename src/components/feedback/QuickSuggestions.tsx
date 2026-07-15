'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { SCOPE_CONFIG, getQuickSuggestions } from '@/config/feedback-scopes'
import type { FeedbackScope, SelectedElement } from './types'

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
      <label className="block text-xs font-medium text-text-secondary">
        Schnellvorschläge
      </label>
      {/* Wrapping pills — a fixed 2-column grid clipped/overlapped the long
          German labels on narrow screens; pills size to their text instead. */}
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className={cn(
              "h-auto whitespace-normal px-2.5 py-1.5 text-xs rounded-full border transition-colors text-left",
              `${config.hoverBg} ${config.borderColor} hover:${config.textColor}`
            )}
            disabled={feedbackScope === 'element' && selectedElements.length === 0 && suggestion !== "Element auswählen"}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
