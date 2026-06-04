/**
 * SuggestionTextarea Component
 * @fileoverview Textarea component for suggestion input with validation and styling
 */

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
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
        <Textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isDisabled}
          className={cn(
            "resize-none min-h-[80px]",
            error && "border-error-300 focus:ring-error-500 focus:border-error-500"
          )}
          placeholder={
            feedbackScope === 'element'
              ? selectedElements.length === 0
                ? "Wähle zuerst Elemente aus..."
                : `Verbesserungsvorschlag für ${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''}...`
              : feedbackScope === 'page'
              ? "Was können wir auf dieser Seite verbessern?"
              : "Allgemeine Verbesserungsvorschläge für die gesamte Website..."
          }
          maxLength={1000}
        />
        {error && (
          <p className="text-error-600 text-xs">{error}</p>
        )}
        <div className="flex justify-between text-xs text-text-tertiary">
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






