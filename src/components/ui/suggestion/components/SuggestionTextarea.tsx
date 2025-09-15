/**
 * SuggestionTextarea Component
 * @fileoverview Isolated textarea component for better input handling and reusability
 */

import { useCallback, forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { SCOPE_CONFIG, VALIDATION, FeedbackScope, SelectedElement } from '../types'
import { validateSuggestion, getCharacterCountColor } from '../utils'

interface SuggestionTextareaProps {
  value: string
  onChange: (value: string) => void
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  disabled?: boolean
  error?: string | null
}

export const SuggestionTextarea = forwardRef<HTMLTextAreaElement, SuggestionTextareaProps>(({
  value,
  onChange,
  feedbackScope,
  selectedElements,
  disabled = false,
  error
}, ref) => {
  const scopeConfig = SCOPE_CONFIG[feedbackScope]
  const [localValue, setLocalValue] = useState(value)

  // Sync local value with prop value when it changes externally
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setLocalValue(newValue)
    onChange(newValue)
  }, [onChange])

  const getPlaceholder = () => {
    switch (feedbackScope) {
      case 'site':
        return "Idee für Website..."
      case 'page':
        return "Was soll verbessert werden?"
      case 'element':
        return selectedElements.length > 0
          ? `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt - Verbesserungsvorschlag?`
          : "Element zuerst auswählen..."
      default:
        return "Was soll verbessert werden?"
    }
  }

  const isDisabled = disabled || (feedbackScope === 'element' && selectedElements.length === 0)
  const validationError = localValue ? validateSuggestion(localValue) : null
  const showError = error || validationError

  return (
    <div>
      <label htmlFor="suggestion" className="block text-xs font-medium text-gray-700 mb-1">
        Ihre Verbesserungsvorschlag *
      </label>
      <textarea
        ref={ref}
        id="suggestion"
        value={localValue}
        onChange={handleChange}
        className={cn(
          "w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:border-transparent resize-none text-xs transition-colors",
          scopeConfig.focusRing,
          showError ? "border-red-500" : "border-gray-300"
        )}
        rows={2}
        maxLength={VALIDATION.MAX_LENGTH_UI}
        placeholder={getPlaceholder()}
        required
        disabled={isDisabled}
      />
      <div className="flex justify-between items-center mt-0.5">
        {feedbackScope === 'element' && selectedElements.length > 0 && (
          <p className="text-xs text-blue-600">
            🎯 {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
          </p>
        )}
        <p className={cn(
          "text-xs ml-auto",
          getCharacterCountColor(localValue.length)
        )}>
          {localValue.length}/{VALIDATION.MAX_LENGTH_UI}
        </p>
      </div>
      {showError && (
        <div className="text-red-600 text-xs mt-1">
          {showError}
        </div>
      )}
    </div>
  )
})

SuggestionTextarea.displayName = 'SuggestionTextarea'