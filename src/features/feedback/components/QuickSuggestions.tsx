import { Button } from '@/components/ui/button'
import { getQuickSuggestions } from '@/config/feedback-scopes'
import type { FeedbackScope, SelectedElement } from '../types'

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
  const suggestions = getQuickSuggestions(feedbackScope, selectedElements.length)

  if (suggestions.length === 0 || suggestions[0] === 'Element auswählen') return null

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-text-secondary">Schnellvorschläge:</div>
      <div className="flex flex-wrap gap-1">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onQuickSuggestion(suggestion)}
            className="h-6 px-2 text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
