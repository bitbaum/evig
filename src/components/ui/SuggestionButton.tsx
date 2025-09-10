'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { Edit3, X, ChevronLeft, ChevronRight, Brain, Info, ExternalLink, Sparkles } from 'lucide-react'
import { useSuggestionContext } from '@/contexts/SuggestionContext'
import Link from 'next/link'

interface SelectedElement {
  element: Element
  elementType: string
  elementText: string
  selector: string
}

interface SuggestionFormData {
  suggestion: string
  contact?: string
  selectedElements?: SelectedElement[]
}

type FeedbackScope = 'page' | 'element' | 'site'

const CONTEXTUAL_SUGGESTIONS = {
  site: ["Navigation verbessern", "Design modernisieren", "Performance optimieren", "Mobile verbessern"],
  page: ["Details hinzufügen", "Link reparieren", "Layout verbessern", "Inhalt aktualisieren"],
  element: (count: number) => count > 0 ? [
    "Besser sichtbar machen",
    "Neu positionieren", 
    "Text ändern",
    "Entfernen"
  ] : ["Element auswählen"]
} as const

// Utility functions for cleaner code
const clearSelectedElements = () => {
  document.querySelectorAll('.suggestion-selected-element').forEach(el => {
    el.classList.remove('suggestion-selected-element')
  })
}

export default function SuggestionButton() {
  const { currentPage, isVisible } = useSuggestionContext()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope>('page')
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false)
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [formData, setFormData] = useState<SuggestionFormData>({
    suggestion: '',
    contact: '',
    selectedElements: []
  })
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const handleSubmitRef = useRef<((e: any) => Promise<void>) | null>(null)

  // Handle focus management when panel opens
  useEffect(() => {
    if (isExpanded && !submitted) {
      // Auto-focus textarea after panel opens
      const timeoutId = setTimeout(() => {
        if (textareaRef.current && feedbackScope !== 'element') {
          textareaRef.current.focus()
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [isExpanded, feedbackScope, submitted])

  // Reset form when page changes (but not when just opening/closing)
  useEffect(() => {
    if (!isExpanded) {
      setFormData(prev => ({ ...prev, suggestion: '', contact: '' }))
      setSubmitted(false)
      setSelectedElements([])
      setFeedbackScope('page')
      setIsElementSelectionMode(false)
      setSubmitError(null)
    }
  }, [currentPage.path, isExpanded])

  // Component-specific utility functions - must be defined before use
  const resetToPageScope = useCallback(() => {
    setFeedbackScope('page')
    setSelectedElements([])
    setIsElementSelectionMode(false)
    clearSelectedElements()
  }, [])

  const closePanelAndReset = useCallback(() => {
    setIsExpanded(false)
    setIsElementSelectionMode(false)
    setSelectedElements([])
    setFeedbackScope('page')
    setSubmitError(null)
    clearSelectedElements()
  }, [])

  // Handle outside click to close and keyboard shortcuts
  const handleClickOutside = useCallback((event: MouseEvent) => {
    // If in element selection mode, don't handle outside clicks
    if (isElementSelectionMode) {
      return
    }

    if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
      closePanelAndReset()
    }
  }, [isElementSelectionMode, closePanelAndReset])


  // Handle element selection mode
  useEffect(() => {
    if (isElementSelectionMode) {

      const handleElementClick = (event: MouseEvent) => {
        const target = event.target as Element

        // Check if the click is on the panel itself - if so, ignore it
        if (panelRef.current?.contains(target)) {
          return
        }

        // Check if the click is on the element selection overlay - if so, ignore it
        const overlay = document.querySelector('[data-element-selection-overlay]')
        if (overlay?.contains(target)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        // Check if element is already selected
        const isAlreadySelected = selectedElements.some(selected => selected.element === target)

        if (isAlreadySelected) {
          // Deselect the element
          setSelectedElements(prev => prev.filter(selected => selected.element !== target))
          target.classList.remove('suggestion-selected-element')
        } else {
          // Select the element

          // Extract element information
          const elementType = target.tagName.toLowerCase()
          const elementText = target.textContent?.substring(0, 100) || ''
          const elementClasses = Array.from(target.classList).join(' ')
          const elementId = target.id || ''

          const newSelectedElement: SelectedElement = {
            element: target,
            elementType,
            elementText,
            selector: elementId ? `#${elementId}` : `.${elementClasses.split(' ')[0]}`
          }

          setSelectedElements(prev => [...prev, newSelectedElement])

          // Add visual marker
          target.classList.add('suggestion-selected-element')
        }
      }

      const handleMouseOver = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (target && !panelRef.current?.contains(target)) {
          target.style.outline = '2px solid #10b981'
          target.style.outlineOffset = '2px'
        }
      }

      const handleMouseOut = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        if (target) {
          target.style.outline = ''
          target.style.outlineOffset = ''
        }
      }

      // Add a small delay to ensure the panel is rendered before attaching listeners
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleElementClick, true)
        document.addEventListener('mouseover', handleMouseOver)
        document.addEventListener('mouseout', handleMouseOut)
      }, 100)

      return () => {
        clearTimeout(timeoutId)
        document.removeEventListener('click', handleElementClick, true)
        document.removeEventListener('mouseover', handleMouseOver)
        document.removeEventListener('mouseout', handleMouseOut)
        // Clean up any remaining outlines
        document.querySelectorAll('[style*="outline"]').forEach(el => {
          const htmlEl = el as HTMLElement
          htmlEl.style.outline = ''
          htmlEl.style.outlineOffset = ''
        })
      }
    }
  }, [isElementSelectionMode, selectedElements])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.suggestion.trim()) return

    setIsSubmitting(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestion: formData.suggestion,
          contact: formData.contact,
          page: currentPage.path,
          url: typeof window !== 'undefined' ? window.location.href : '',
          pageTitle: currentPage.title,
          pageSection: currentPage.section,
          feedbackScope,
          selectedElements: selectedElements.map(el => ({
            elementType: el.elementType,
            elementText: el.elementText,
            selector: el.selector
          })),
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setFormData(prev => ({ ...prev, suggestion: '', contact: '', selectedElements: [] }))
        setTimeout(() => {
          setIsExpanded(false)
          setSubmitted(false)
          setSelectedElements([])
          setFeedbackScope('page')
          setIsElementSelectionMode(false)
        }, 2000)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setSubmitError(errorData.message || `Fehler beim Senden (${response.status})`)
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      setSubmitError('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData.suggestion, formData.contact, currentPage.path, currentPage.title, currentPage.section, feedbackScope, selectedElements])

  // Update handleSubmit ref
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  }, [handleSubmit])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closePanelAndReset()
    }
    // Ctrl+Enter to submit
    if (event.key === 'Enter' && event.ctrlKey && isExpanded && !isElementSelectionMode) {
      event.preventDefault()
      if (formData.suggestion.trim() && !(feedbackScope === 'element' && selectedElements.length === 0)) {
        handleSubmitRef.current?.(event as any)
      }
    }
  }, [isExpanded, isElementSelectionMode, formData.suggestion, feedbackScope, selectedElements, closePanelAndReset, handleSubmitRef])

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

  // Feedback scope selector component - Compact version
  const FeedbackScopeSelector = () => (
    <div className="mb-2">
      <h4 className="text-sm font-medium text-gray-700 mb-1.5">Was möchten Sie verbessern?</h4>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (feedbackScope !== 'site') {
              setFeedbackScope('site')
              setSelectedElements([])
              setIsElementSelectionMode(false)
              clearSelectedElements()
            }
          }}
          className={cn(
            "flex-1 p-1.5 rounded-md border transition-all duration-200 text-center text-xs",
            feedbackScope === 'site'
              ? "border-purple-500 bg-purple-50 text-purple-900 font-medium"
              : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-25"
          )}
        >
          <div className="font-medium">Website</div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (feedbackScope !== 'page') {
              resetToPageScope()
            }
          }}
          className={cn(
            "flex-1 p-1.5 rounded-md border transition-all duration-200 text-center text-xs",
            feedbackScope === 'page'
              ? "border-green-500 bg-green-50 text-green-900 font-medium"
              : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-25"
          )}
        >
          <div className="font-medium">Diese Seite</div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (feedbackScope !== 'element') {
              setFeedbackScope('element')
              setIsElementSelectionMode(true)
              setSelectedElements([])
              clearSelectedElements()
            } else {
              // Toggle element selection mode
              setIsElementSelectionMode(!isElementSelectionMode)
            }
          }}
          className={cn(
            "flex-1 p-1.5 rounded-md border transition-all duration-200 text-center text-xs",
            feedbackScope === 'element'
              ? "border-blue-500 bg-blue-50 text-blue-900 font-medium"
              : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-25"
          )}
        >
          <div className="font-medium">Element</div>
          {selectedElements.length > 0 && (
            <div className="text-xs mt-0.5 text-blue-600">{selectedElements.length}</div>
          )}
        </button>
      </div>
    </div>
  )

  // Quick suggestions component - now context-aware
  const ContextualQuickSuggestions = () => {
    const suggestions = feedbackScope === 'element' 
      ? CONTEXTUAL_SUGGESTIONS.element(selectedElements.length)
      : CONTEXTUAL_SUGGESTIONS[feedbackScope] || []

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
              onClick={() => setFormData(prev => ({ ...prev, suggestion }))}
              className={cn(
                "text-left py-1 px-1.5 text-xs bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded transition-colors truncate",
                feedbackScope === 'site' && "hover:bg-purple-50 hover:border-purple-300",
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

  // Form component - Compact version
  const SuggestionForm = () => (
    <form onSubmit={handleSubmit} className="space-y-2">
      <FeedbackScopeSelector />
      <ContextualQuickSuggestions />

      <div>
        <label htmlFor="suggestion" className="block text-xs font-medium text-gray-700 mb-1">
          Ihre Verbesserungsvorschlag *
        </label>
        <textarea
          ref={textareaRef}
          id="suggestion"
          value={formData.suggestion}
          onChange={(e) => setFormData(prev => ({ ...prev, suggestion: e.target.value }))}
          className={cn(
            "w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:border-transparent resize-none text-xs transition-colors",
            feedbackScope === 'site' && "focus:ring-purple-500",
            feedbackScope === 'page' && "focus:ring-green-500",
            feedbackScope === 'element' && "focus:ring-blue-500"
          )}
          rows={2}
          maxLength={500}
          placeholder={
            feedbackScope === 'site'
              ? "Idee für Website..."
              : feedbackScope === 'page'
                ? "Was soll verbessert werden?"
                : selectedElements.length > 0
                  ? `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt - Verbesserungsvorschlag?`
                  : "Element zuerst auswählen..."
          }
          required
          disabled={feedbackScope === 'element' && selectedElements.length === 0}
        />
        <div className="flex justify-between items-center mt-0.5">
          {feedbackScope === 'element' && selectedElements.length > 0 && (
            <p className="text-xs text-blue-600">🎯 {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt</p>
          )}
          <p className={cn(
            "text-xs ml-auto",
            formData.suggestion.length > 450
              ? "text-orange-600"
              : formData.suggestion.length > 480
                ? "text-red-600"
                : "text-gray-500"
          )}>
            {formData.suggestion.length}/500
          </p>
        </div>
      </div>

      <div>
        <input
          type="text"
          id="contact"
          value={formData.contact || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
          className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs"
          placeholder="Name/E-Mail (optional)"
        />
      </div>

      {submitError && (
        <div className="text-red-600 text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
          {submitError}
        </div>
      )}

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
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            closePanelAndReset()
          }}
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

      {/* Element Selection Overlay - shown when in selection mode */}
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

          {/* Selected elements counter */}
          {selectedElements.length > 0 && (
            <div className="absolute top-20 left-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm font-medium">
              ✅ {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
            </div>
          )}

          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => {
                setIsElementSelectionMode(false)
                // Keep the selected elements
              }}
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

      {/* Small Floating Button - only show when closed */}
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
            {/* Pulse effect when element selection is active */}
            {isElementSelectionMode && (
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
            )}
          </button>
        </div>
      )}

      {/* Backdrop for outside click closing - only when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-25 z-35 cursor-pointer"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            closePanelAndReset()
          }}
        />
      )}

      {/* Expandable Side Panel - only render when expanded */}
      {isExpanded && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-panel-title"
            aria-describedby="suggestion-panel-description"
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
                <h3 id="suggestion-panel-title" className="font-semibold text-gray-900 text-sm">Verbesserungen vorschlagen</h3>
              </div>
              <button
                ref={closeButtonRef}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  closePanelAndReset()
                }}
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

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 pb-2">
            {submitted ? (
                <SuccessMessage />
              ) : (
                <SuggestionForm />
              )}
                  </div>
                </div>

          {/* Footer with link */}
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