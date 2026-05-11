'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Edit3, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { uiEvents } from '@/lib/ui/uiEvents'
import { ELEMENT_SELECTION_COLORS } from '@/config/ui-colors'

import type { FeedbackScope } from '../types'
import { SCOPE_CONFIG } from '../config/scope-config'
import { useElementSelection } from '../hooks/useElementSelection'
import { useSuggestionForm, getCurrentPageInfo } from '../hooks/useSuggestionForm'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { FeedbackScopeSelector } from './FeedbackScopeSelector'
import { QuickSuggestions } from './QuickSuggestions'
import { SuccessMessage } from './SuccessMessage'
import '../styles/element-selection.css'

export default function SuggestionButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope>('page')
  const panelRef = useRef<HTMLDivElement>(null)

  const {
    isElementSelectionMode,
    setIsElementSelectionMode,
    selectedElements,
    setSelectedElements,
    toggleElementSelection,
    resetToPageScope,
  } = useElementSelection({ feedbackScope, setFeedbackScope })

  // closePanelAndReset is defined below but passed via ref in the hook,
  // so it always has the latest reference when actually invoked.
  const closePanelAndResetRef = useRef<() => void>(() => {})

  const {
    isSubmitting,
    submitted,
    submitError,
    textareaRef,
    contactRef,
    handleQuickSuggestion: _handleQuickSuggestion,
    handleSubmit,
    resetFormState: _resetFormState,
  } = useSuggestionForm({
    feedbackScope,
    selectedElements,
    onSubmitSuccess: () => closePanelAndResetRef.current(),
  })

  const [textValue, setTextValue] = useState('')

  const handleQuickSuggestion = useCallback((suggestion: string) => {
    _handleQuickSuggestion(suggestion)
    setTextValue(textareaRef.current?.value || '')
  }, [_handleQuickSuggestion, textareaRef])

  const resetFormState = useCallback(() => {
    _resetFormState()
    setTextValue('')
  }, [_resetFormState])

  const closePanelAndReset = useCallback(() => {
    setIsExpanded(false)
    setIsElementSelectionMode(false)
    setSelectedElements([])
    setFeedbackScope('page')
    resetFormState()
  }, [setIsElementSelectionMode, setSelectedElements, resetFormState])

  // Keep ref in sync
  useEffect(() => {
    closePanelAndResetRef.current = closePanelAndReset
  }, [closePanelAndReset])

  useKeyboardShortcuts({ isExpanded, isSubmitting, closePanelAndReset })

  const config = SCOPE_CONFIG[feedbackScope]

  // Expanded panel view
  if (isExpanded) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/25 z-[50] cursor-pointer"
          onClick={closePanelAndReset}
          style={{
            pointerEvents: isElementSelectionMode ? 'none' : 'auto',
            display: isExpanded ? 'block' : 'none'
          }}
        />

        {/* Element Selection Overlay */}
        {isElementSelectionMode && (
          <div
            data-element-selection-overlay
            className="fixed inset-0 z-[65]"
            style={{
              background: ELEMENT_SELECTION_COLORS.overlay,
              pointerEvents: 'none'
            }}
          >
            <div className="absolute top-20 left-4 sm:left-4 right-4 sm:right-auto bg-info-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs sm:max-w-xs">
              <div className="flex items-center space-x-2">
                <span>{'\uD83C\uDFAF'}</span>
                <div>
                  <div>Element-Auswahl aktiv</div>
                  <div className="text-xs opacity-90 mt-1">
                    {selectedElements.length === 0
                      ? "Klicken Sie auf Elemente zum Auswählen"
                      : `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt`
                    }
                  </div>
                  {selectedElements.length > 0 && (
                    <div className="text-xs opacity-75 mt-2 max-w-full">
                      <div className="font-medium mb-1">Ausgewählte Elemente:</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {selectedElements.slice(0, 3).map((el, index) => (
                          <div key={index} className="bg-info-500 bg-opacity-30 rounded px-2 py-1 text-xs truncate">
                            {el.elementType}: {el.elementText.substring(0, 30)}...
                          </div>
                        ))}
                        {selectedElements.length > 3 && (
                          <div className="text-xs opacity-75">...und {selectedElements.length - 3} weitere</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute top-4 left-4 right-4 sm:right-4 sm:left-auto flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2" style={{ pointerEvents: 'auto' }}>
              <button
                onClick={() => setIsElementSelectionMode(false)}
                className="bg-primary-600 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors touch-manipulation"
                style={{ pointerEvents: 'auto' }}
              >
                Fertig ({selectedElements.length})
              </button>
              <button
                onClick={() => {
                  setIsElementSelectionMode(false)
                  resetToPageScope()
                }}
                className="bg-neutral-600 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-neutral-700 active:bg-neutral-800 transition-colors touch-manipulation"
                style={{ pointerEvents: 'auto' }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Side Panel */}
        <div
          className="fixed z-[70] sm:right-4 sm:top-20 bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-auto"
          style={{ maxHeight: 'calc(100vh - 5rem)' }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-panel-title"
            data-suggestion-panel
            className={cn(
              "bg-white shadow-2xl border border-neutral-200 rounded-2xl sm:rounded-l-2xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-[70vh] h-auto",
              "w-[calc(100%-2rem)] max-w-sm sm:w-80 md:w-96",
              isElementSelectionMode && "ring-2 ring-info-500 ring-opacity-50 pointer-events-auto"
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-50 to-info-50 border-b border-neutral-200 px-4 py-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-primary-600" />
                  <Heading level={3} id="suggestion-panel-title" className="font-semibold text-neutral-900 text-sm">
                    Verbesserungen vorschlagen
                  </Heading>
                </div>
                <button
                  onClick={closePanelAndReset}
                  className="text-neutral-500 hover:text-neutral-600 active:bg-neutral-200 transition-colors p-2 sm:p-1 hover:bg-neutral-100 rounded-full touch-manipulation"
                  aria-label="Panel schliessen"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-neutral-600">
                Aktuelle Seite: <span className="font-medium text-neutral-900">
                  {getCurrentPageInfo().path === '/' ? 'Startseite' : getCurrentPageInfo().title}
                </span>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 pb-2">
                {submitted ? (
                  <SuccessMessage />
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className="space-y-3">
                    <FeedbackScopeSelector
                      feedbackScope={feedbackScope}
                      setFeedbackScope={setFeedbackScope}
                      isElementSelectionMode={isElementSelectionMode}
                      setIsElementSelectionMode={setIsElementSelectionMode}
                      selectedElements={selectedElements}
                      setSelectedElements={setSelectedElements}
                      toggleElementSelection={toggleElementSelection}
                    />
                    <QuickSuggestions
                      feedbackScope={feedbackScope}
                      selectedElements={selectedElements}
                      onSuggestionClick={handleQuickSuggestion}
                    />

                    <div>
                      <label htmlFor="suggestion" className="block text-xs font-medium text-neutral-700 mb-1">
                        Ihr Verbesserungsvorschlag *
                      </label>
                      <textarea
                        ref={textareaRef}
                        id="suggestion"
                        className={cn(
                          "w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:border-transparent resize-none text-xs transition-colors",
                          config.focusRing,
                          submitError ? "border-error-500" : "border-neutral-300"
                        )}
                        rows={3}
                        maxLength={500}
                        placeholder={
                          feedbackScope === 'site' ? "Idee für Website..." :
                          feedbackScope === 'page' ? "Was soll verbessert werden?" :
                          selectedElements.length > 0
                            ? `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt - Verbesserungsvorschlag?`
                            : "Element zuerst auswählen..."
                        }
                        disabled={feedbackScope === 'element' && selectedElements.length === 0}
                        required
                        onInput={(e) => setTextValue((e.target as HTMLTextAreaElement).value)}
                      />
                      <div className="flex justify-between items-center mt-0.5">
                        {feedbackScope === 'element' && selectedElements.length > 0 && (
                          <p className="text-xs text-info-600">
                            {'\uD83C\uDFAF'} {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
                          </p>
                        )}
                        <p className="text-xs text-neutral-500 ml-auto">
                          {textValue.length}/500
                        </p>
                      </div>
                      {submitError && (
                        <div className="text-error-600 text-xs mt-1">
                          {submitError}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        ref={contactRef}
                        type="text"
                        id="contact"
                        className="w-full px-2 py-1 border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-xs"
                        placeholder="Name/E-Mail (optional)"
                        autoComplete="off"
                      />
                    </div>

                    <div className="flex space-x-1.5">
                      <button
                        type="submit"
                        disabled={isSubmitting || !textValue.trim() || (feedbackScope === 'element' && selectedElements.length === 0)}
                        className={cn(
                          "flex-1 py-1 px-2 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                          config.buttonBg,
                          "text-white"
                        )}
                      >
                        {isSubmitting ? 'Sendet...' : 'Senden'}
                      </button>

                      <button
                        type="button"
                        onClick={closePanelAndReset}
                        disabled={isSubmitting}
                        className="px-2 py-1 text-xs rounded border-neutral-300 hover:bg-neutral-50 border"
                      >
                        Abbrechen
                      </button>
                    </div>

                    <div className="text-xs text-neutral-400 text-center">
                      ESC schliesst | Ctrl+Enter sendet
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50 flex-shrink-0">
            </div>
          </div>
        </div>
      </>
    )
  }

  // Floating Button (collapsed state)
  return (
    <div className="fixed z-[75] sm:right-4 sm:top-1/2 sm:-translate-y-1/2 right-4 top-20">
      <button
        onClick={() => { setIsExpanded(true); uiEvents.emit('openSuggestion') }}
        className={cn(
          "group relative",
          "bg-primary-100 hover:bg-primary-600 text-primary-600 hover:text-white",
          "w-12 h-12 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
          "flex items-center justify-center",
          "border-2 border-white shadow-black/10",
          "hover:scale-110 active:scale-95 touch-manipulation",
          isExpanded && "ring-2 ring-primary-500 ring-offset-2"
        )}
        aria-label="Verbesserungen vorschlagen öffnen"
        aria-expanded={isExpanded}
        aria-haspopup="dialog"
        role="button"
        tabIndex={0}
      >
        <Edit3 className="w-5 h-5" />
      </button>
    </div>
  )
}
