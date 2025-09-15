/**
 * Refactored SuggestionButton Component
 * @fileoverview Modular, maintainable suggestion system with proper separation of concerns
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Edit3, X, Info } from 'lucide-react'
import { useSuggestionContext } from '@/contexts/SuggestionContext'
import Link from 'next/link'

// Import modular components and hooks
import { SuggestionTextarea, FeedbackScopeSelector, QuickSuggestions } from './suggestion/components'
import { useSuggestionForm, useElementSelection } from './suggestion/hooks'
import { FeedbackScope } from './suggestion/types'

export default function SuggestionButton() {
  const { currentPage, isVisible } = useSuggestionContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope>('page')
  const [submitted, setSubmitted] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Custom hooks for better separation of concerns
  const {
    formData,
    isSubmitting,
    submitError,
    updateSuggestion,
    updateContact,
    resetForm,
    submitSuggestion,
    setSubmitError
  } = useSuggestionForm({
    onSuccess: () => {
      setSubmitted(true)
      setTimeout(() => {
        closePanelAndReset()
      }, 2000)
    }
  })

  const {
    selectedElements,
    isElementSelectionMode,
    toggleElementSelection,
    resetSelection,
    setIsElementSelectionMode
  } = useElementSelection({ panelRef })

  // Handle focus management when panel opens
  useEffect(() => {
    if (isExpanded && !submitted && feedbackScope !== 'element') {
      const timeoutId = setTimeout(() => {
        textareaRef.current?.focus()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [isExpanded, feedbackScope, submitted])

  // Reset form when page changes or panel closes
  useEffect(() => {
    if (!isExpanded) {
      resetForm()
      setSubmitted(false)
      resetSelection()
      setFeedbackScope('page')
      setSubmitError(null)
    }
  }, [currentPage.path, isExpanded, resetForm, resetSelection, setSubmitError])

  // Component-specific utility functions
  const resetToPageScope = useCallback(() => {
    setFeedbackScope('page')
    resetSelection()
  }, [resetSelection])

  const closePanelAndReset = useCallback(() => {
    setIsExpanded(false)
    setIsElementSelectionMode(false)
    resetSelection()
    setFeedbackScope('page')
    setSubmitError(null)
  }, [resetSelection, setSubmitError, setIsElementSelectionMode])

  // Handle outside click to close
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (isElementSelectionMode) return

    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      closePanelAndReset()
    }
  }, [isElementSelectionMode, closePanelAndReset])

  // Form submission handler
  const handleSubmit = useCallback(async () => {
    const success = await submitSuggestion(feedbackScope, selectedElements)
    if (success) {
      setSubmitted(true)
    }
  }, [submitSuggestion, feedbackScope, selectedElements])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePanelAndReset()
    }
    // Ctrl+Enter to submit
    if (event.key === 'Enter' && event.ctrlKey && isExpanded && !isElementSelectionMode) {
      event.preventDefault()
      if (formData.suggestion.trim() && !(feedbackScope === 'element' && selectedElements.length === 0)) {
        handleSubmit()
      }
    }
  }, [isExpanded, isElementSelectionMode, formData.suggestion, feedbackScope, selectedElements, closePanelAndReset, handleSubmit])

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isExpanded, handleClickOutside, handleKeyDown])

  if (!isVisible) return null

  // Success message component
  const SuccessMessage = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-4 animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">Vielen Dank! 🎉</h3>
      <p className="text-sm text-gray-600 mb-4">Ihr Vorschlag wurde erfolgreich gesendet.</p>
      <div className="text-xs text-gray-500">
        Wir werden uns schnellstmöglich darum kümmern.
      </div>
    </div>
  )

  // Form component
  const SuggestionForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-2">
      <FeedbackScopeSelector
        feedbackScope={feedbackScope}
        selectedElements={selectedElements}
        onScopeChange={setFeedbackScope}
        onElementSelectionToggle={toggleElementSelection}
        onResetToPageScope={resetToPageScope}
        isElementSelectionMode={isElementSelectionMode}
      />

      <QuickSuggestions
        feedbackScope={feedbackScope}
        selectedElements={selectedElements}
        onQuickSuggestion={updateSuggestion}
      />

      <SuggestionTextarea
        ref={textareaRef}
        value={formData.suggestion}
        onChange={updateSuggestion}
        feedbackScope={feedbackScope}
        selectedElements={selectedElements}
        disabled={feedbackScope === 'element' && selectedElements.length === 0}
        error={submitError}
      />

      <div>
        <input
          type="text"
          id="contact"
          value={formData.contact || ''}
          onChange={(e) => updateContact(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs"
          placeholder="Name/E-Mail (optional)"
        />
      </div>

      <div className="flex space-x-1.5">
        <Button
          type="submit"
          disabled={isSubmitting || !formData.suggestion.trim() || (feedbackScope === 'element' && selectedElements.length === 0)}
          className={cn(
            "flex-1 py-1 px-2 rounded text-xs font-medium transition-colors",
            feedbackScope === 'site' && "bg-purple-600 hover:bg-purple-700 text-white",
            feedbackScope === 'page' && "bg-green-600 hover:bg-green-700 text-white",
            feedbackScope === 'element' && "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {isSubmitting ? 'Sendet...' : 'Senden'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={closePanelAndReset}
          disabled={isSubmitting}
          className="px-2 py-1 text-xs rounded border-gray-300 hover:bg-gray-50"
        >
          Abbrechen
        </Button>
      </div>

      <div className="text-xs text-gray-400 text-center">
        💡 ESC schliesst • Ctrl+Enter sendet
      </div>
    </form>
  )

  return (
    <>
      {/* Global styles for selected elements */}
      <style jsx global>{`
        .suggestion-selected-element {
          position: relative;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
          border: 2px solid #3b82f6 !important;
        }
        .suggestion-selected-element::after {
          content: '✓';
          position: absolute;
          top: -8px;
          right: -8px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          z-index: 1000;
        }
      `}</style>

      {/* Element Selection Overlay */}
      {isElementSelectionMode && (
        <div
          data-element-selection-overlay
          className="fixed inset-0 bg-blue-500 bg-opacity-10 z-30 pointer-events-none"
        >
          <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium">
            <div className="flex items-center space-x-2">
              <span>🎯</span>
              <div>
                <div>Element-Auswahl aktiv</div>
                <div className="text-xs opacity-90 mt-1">
                  {selectedElements.length === 0
                    ? "Klicken Sie auf Elemente zum Auswählen"
                    : `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt`
                  }
                </div>
              </div>
            </div>
          </div>

          {selectedElements.length > 0 && (
            <div className="absolute top-20 left-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
              ✅ {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
            </div>
          )}

          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => setIsElementSelectionMode(false)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              ✅ Fertig ({selectedElements.length})
            </button>
            <button
              onClick={() => {
                setIsElementSelectionMode(false)
                resetToPageScope()
              }}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              ❌ Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isExpanded && !isElementSelectionMode && isVisible && (
        <div className="fixed right-4 top-1/2 z-50 -translate-y-1/2">
          <button
            onClick={() => setIsExpanded(true)}
            className={cn(
              "group relative",
              "bg-green-100 hover:bg-green-600 text-green-600 hover:text-white",
              "w-12 h-12 rounded-full shadow-lg hover:shadow-xl",
              "transition-all duration-300 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
              "flex items-center justify-center",
              "border-2 border-white shadow-black/10"
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
      )}

      {/* Backdrop */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-35 cursor-pointer"
          onClick={closePanelAndReset}
        />
      )}

      {/* Side Panel */}
      {isExpanded && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-panel-title"
            aria-describedby="suggestion-panel-description"
            data-suggestion-panel
            className={cn(
              "bg-white shadow-2xl border border-gray-200 w-80 sm:w-96 rounded-l-2xl overflow-hidden flex flex-col",
              "fixed right-0 top-1/2 -translate-y-1/2 max-h-[70vh] h-auto",
              isElementSelectionMode && "ring-2 ring-blue-500 ring-opacity-50 pointer-events-auto"
            )}
            style={isElementSelectionMode ? { pointerEvents: 'auto' } : undefined}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-green-600" />
                  <h3 id="suggestion-panel-title" className="font-semibold text-gray-900 text-sm">
                    Verbesserungen vorschlagen
                  </h3>
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={closePanelAndReset}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
                  aria-label="Panel schließen"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div id="suggestion-panel-description" className="mt-2 text-xs text-gray-600">
                Aktuelle Seite: <span className="font-medium text-gray-900">
                  {currentPage.path === '/' ? 'Startseite' : currentPage.title || currentPage.path}
                </span>
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="p-4 pb-2">
                {submitted ? <SuccessMessage /> : <SuggestionForm />}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex-shrink-0">
              <Link
                href="/revamp-ux#wie-funktioniert"
                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 justify-center"
              >
                <Info className="w-3 h-3" />
                <span>Wie funktioniert's?</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

