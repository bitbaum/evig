/**
 * SuggestionTextarea Component
 * @fileoverview Textarea component for suggestion input with validation and styling
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { FeedbackScope, SelectedElement } from '../types'

interface SuggestionTextareaProps {
  value: string
  onChange: (value: string) => void
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  disabled?: boolean
  error?: string | null
}

export const SuggestionTextarea = forwardRef<HTMLTextAreaElement, SuggestionTextareaProps>(
  ({ value, onChange, feedbackScope, selectedElements, disabled = false, error }, ref) => {
    const isDisabled = disabled || (feedbackScope === 'element' && selectedElements.length === 0)

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className={cn(
            "w-full px-3 py-2 border rounded-lg resize-none focus:outline-none focus:ring-2 transition-colors",
            "min-h-[80px] text-sm",
            isDisabled && "bg-gray-100 cursor-not-allowed opacity-50",
            error
              ? "border-red-300 focus:ring-red-500 focus:border-red-500"
              : "border-gray-300 focus:ring-green-500 focus:border-green-500"
          )}
          placeholder={
            feedbackScope === 'element'
              ? selectedElements.length === 0
                ? "Wählen Sie zuerst Elemente aus..."
                : `Verbesserungsvorschlag für ${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''}...`
              : feedbackScope === 'page'
              ? "Was können wir auf dieser Seite verbessern?"
              : "Allgemeine Verbesserungsvorschläge für die gesamte Website..."
          }
          maxLength={1000}
        />
        {error && (
          <p className="text-red-600 text-xs">{error}</p>
        )}
        <div className="flex justify-between text-xs text-gray-500">
          <span>{value.length}/1000 Zeichen</span>
          {feedbackScope === 'element' && selectedElements.length > 0 && (
            <span>{selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt</span>
          )}
        </div>
      </div>
    )
  }
)

SuggestionTextarea.displayName = 'SuggestionTextarea'






