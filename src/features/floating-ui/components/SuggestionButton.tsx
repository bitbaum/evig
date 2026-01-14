'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Edit3, X, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uiEvents } from '@/lib/ui/uiEvents'
import { logger } from '@/lib/logger'
// Import types inline to avoid potential import issues
type FeedbackScope = 'page' | 'element' | 'site'

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

// Scope configuration
const SCOPE_CONFIG = {
  site: {
    emoji: '🌐',
    name: 'Gesamte Website',
    color: '#7c3aed',
    focusRing: 'focus:ring-purple-500',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    hoverBg: 'hover:bg-purple-50 hover:border-purple-300'
  },
  page: {
    emoji: '📄',
    name: 'Diese Seite',
    color: '#16a34a',
    focusRing: 'focus:ring-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    hoverBg: 'hover:bg-green-50 hover:border-green-300'
  },
  element: {
    emoji: '🎯',
    name: 'Spezifisches Element',
    color: '#2563eb',
    focusRing: 'focus:ring-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    hoverBg: 'hover:bg-blue-50 hover:border-blue-300'
  }
} as const

// Quick suggestions based on scope
const getQuickSuggestions = (scope: FeedbackScope, elementCount: number = 0) => {
  switch (scope) {
    case 'site':
      return ["Navigation verbessern", "Design modernisieren", "Performance optimieren", "Mobile verbessern"]
    case 'page':
      return ["Details hinzufügen", "Link reparieren", "Layout verbessern", "Inhalt aktualisieren"]
    case 'element':
      return elementCount > 0 ?
        ["Besser sichtbar machen", "Neu positionieren", "Text ändern", "Entfernen"] :
        ["Element auswählen"]
  }
}


export default function SuggestionButton() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [feedbackScope, setFeedbackScope] = useState<FeedbackScope>('page')
  const [selectedElements, setSelectedElements] = useState<SelectedElement[]>([])
  const [isElementSelectionMode, setIsElementSelectionMode] = useState(false)
  // Removed formData state - using refs directly for uncontrolled inputs
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)


  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const contactRef = useRef<HTMLInputElement>(null)
  const lastHoverRef = useRef<Element | null>(null)

  // Get current page info
  const getCurrentPageInfo = () => {
    if (typeof window === 'undefined') return { path: '/', title: 'Home' }
    return {
      path: window.location.pathname,
      title: document.title || window.location.pathname
    }
  }

  // Element selection functionality
  const toggleElementSelection = useCallback(() => {
    setIsElementSelectionMode(!isElementSelectionMode)
    if (!isElementSelectionMode) {
      setFeedbackScope('element')
    }
  }, [isElementSelectionMode])

  const resetToPageScope = useCallback(() => {
    setFeedbackScope('page')
    setSelectedElements([])
    setIsElementSelectionMode(false)
  }, [])

  // Form handlers - removed to make inputs truly uncontrolled
  // Values will be read directly from refs when submitting

  const handleQuickSuggestion = useCallback((suggestion: string) => {
    const currentValue = textareaRef.current?.value || ''
    const newSuggestion = currentValue
      ? `${currentValue} ${suggestion}`
      : suggestion

    if (textareaRef.current) {
      textareaRef.current.value = newSuggestion
      // Clear any existing error when user types
      setSubmitError(null)
    }
  }, [])

  const closePanelAndReset = useCallback(() => {
    setIsExpanded(false)
    setIsElementSelectionMode(false)
    setSelectedElements([])
    setFeedbackScope('page')
    setSubmitError(null)
    setSubmitted(false)

    // Clear the input values
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
    if (contactRef.current) {
      contactRef.current.value = ''
    }
  }, [])

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isExpanded) return

      if (e.key === 'Escape') {
        e.preventDefault()
        closePanelAndReset()
      }

      if (e.key === 'Enter' && e.ctrlKey && !isSubmitting) {
        e.preventDefault()
        const form = document.querySelector('[data-suggestion-panel] form') as HTMLFormElement
        if (form) {
          form.requestSubmit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded, isSubmitting, closePanelAndReset])


  // Submit functionality
  const handleSubmit = useCallback(async () => {
    const actualSuggestion = textareaRef.current?.value?.trim() || ''
    const actualContact = contactRef.current?.value?.trim() || ''

    if (!actualSuggestion) {
      setSubmitError('Bitte geben Sie einen Vorschlag ein.')
      return
    }

    if (feedbackScope === 'element' && selectedElements.length === 0) {
      setSubmitError('Bitte wählen Sie mindestens ein Element aus.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const currentPage = getCurrentPageInfo()

      const submissionData = {
        suggestion: actualSuggestion,
        contact: actualContact || undefined,
        page: currentPage.path,
        url: window.location.href,
        pageTitle: currentPage.title,
        pageSection: currentPage.path.split('/')[1] || 'home',
        feedbackScope,
        selectedElements: selectedElements.map(el => ({
          elementType: el.elementType,
          elementText: el.elementText.substring(0, 100),
          selector: el.selector
        })),
        timestamp: new Date().toISOString()
      }

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Senden der Nachricht')
      }

      setSubmitted(true)
      setTimeout(() => {
        closePanelAndReset()
      }, 2000)

    } catch (error) {
      logger.error('Submission error', { error })
      setSubmitError('Fehler beim Senden. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }, [feedbackScope, selectedElements, closePanelAndReset])

  // Element selection mode effects
  useEffect(() => {
    if (!isElementSelectionMode) return

    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as Element
      if (target.closest('[data-suggestion-panel]') || target.closest('[data-element-selection-overlay]')) {
        return
      }

      const elementType = target.tagName.toLowerCase()
      const elementText = target.textContent?.trim() || ''
      const selector = generateSelector(target)

      const elementData: SelectedElement = {
        element: target,
        elementType,
        elementText: elementText.substring(0, 100),
        selector
      }

      const existingIndex = selectedElements.findIndex(el => el.selector === selector)
      if (existingIndex > -1) {
        setSelectedElements(prev => prev.filter((_, i) => i !== existingIndex))
        target.classList.remove('suggestion-selected-element')
      } else {
        setSelectedElements(prev => [...prev, elementData])
        target.classList.add('suggestion-selected-element')
      }
    }

    document.addEventListener('click', handleElementClick, true)
    return () => {
      document.removeEventListener('click', handleElementClick, true)
      // Clean up selected element classes
      document.querySelectorAll('.suggestion-selected-element').forEach(el => {
        el.classList.remove('suggestion-selected-element')
      })
    }
  }, [isElementSelectionMode, selectedElements])

  // Hover highlight while in element selection mode
  useEffect(() => {
    if (!isElementSelectionMode) return

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.closest('[data-suggestion-panel]') || target.closest('[data-element-selection-overlay]')) {
        return
      }

      if (lastHoverRef.current && lastHoverRef.current !== target) {
        lastHoverRef.current.classList.remove('suggestion-hover-element')
      }
      lastHoverRef.current = target
      target.classList.add('suggestion-hover-element')
    }

    document.addEventListener('mousemove', handleMouseMove, true)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true)
      if (lastHoverRef.current) {
        lastHoverRef.current.classList.remove('suggestion-hover-element')
        lastHoverRef.current = null
      }
    }
  }, [isElementSelectionMode])

  // Simple selector generator
  const generateSelector = (element: Element): string => {
    if (element.id) return `#${element.id}`
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c && !c.startsWith('suggestion-'))
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`
      }
    }
    return element.tagName.toLowerCase()
  }

  // Scope Selector Component
  const FeedbackScopeSelector = () => (
    <div className="space-y-3">
      <label className="block text-xs font-medium text-gray-700">
        Feedback-Bereich *
      </label>
      <div className="grid grid-cols-1 gap-2">
        {(Object.keys(SCOPE_CONFIG) as FeedbackScope[]).map((scope) => {
          const config = SCOPE_CONFIG[scope]
          const isActive = feedbackScope === scope

          return (
            <button
              key={scope}
              type="button"
              onClick={() => {
                setFeedbackScope(scope)
                if (scope !== 'element') {
                  setIsElementSelectionMode(false)
                  setSelectedElements([])
                }
              }}
              className={cn(
                "w-full px-3 py-2.5 text-xs rounded-lg border-2 transition-all duration-200",
                isActive
                  ? `${config.bgColor} ${config.borderColor} ${config.textColor} shadow-md transform scale-[1.02]`
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-base">{config.emoji}</span>
                <div className="text-left">
                  <span className="font-medium block leading-tight">{config.name}</span>
                  <span className="text-xs opacity-75 block leading-tight">
                    {scope === 'site' && 'Gesamte Website verbessern'}
                    {scope === 'page' && 'Diese Seite optimieren'}
                    {scope === 'element' && 'Spezifische Elemente auswählen'}
                  </span>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-current rounded-full opacity-75"></div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {feedbackScope === 'element' && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            type="button"
            onClick={toggleElementSelection}
            className={cn(
              "w-full px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200",
              isElementSelectionMode
                ? "bg-blue-600 text-white border-blue-600 shadow-md"
                : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
            )}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🎯</span>
              <span className="font-medium">
                {isElementSelectionMode
                  ? `Auswahl aktiv (${selectedElements.length})`
                  : "Elemente auswählen"}
              </span>
            </div>
          </button>

          {selectedElements.length > 0 && !isElementSelectionMode && (
            <div className="mt-2 p-2 bg-white rounded border border-blue-200">
              <p className="text-xs font-medium text-blue-800 mb-1">
                ✅ {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
              </p>
              <div className="space-y-1">
                {selectedElements.slice(0, 2).map((el, index) => (
                  <div key={index} className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded truncate">
                    {el.elementType}: {el.elementText.substring(0, 25)}...
                  </div>
                ))}
                {selectedElements.length > 2 && (
                  <div className="text-xs text-blue-600 italic">
                    +{selectedElements.length - 2} weitere...
                  </div>
                )}
              </div>
            </div>
          )}

          {isElementSelectionMode && (
            <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-2 rounded">
              💡 Klicken Sie auf Elemente der Seite, um sie auszuwählen
            </div>
          )}
        </div>
      )}
    </div>
  )

  // Quick Suggestions Component
  const QuickSuggestions = () => {
    const suggestions = getQuickSuggestions(feedbackScope, selectedElements.length)
    const config = SCOPE_CONFIG[feedbackScope]

    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-700">
          Schnellvorschläge
        </label>
        <div className="grid grid-cols-2 gap-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleQuickSuggestion(suggestion)}
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

  // Success Message Component
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

  // Main Form Component
  const SuggestionForm = () => {
    const config = SCOPE_CONFIG[feedbackScope]

    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-3">
        <FeedbackScopeSelector />
        <QuickSuggestions />

        <div>
          <label htmlFor="suggestion" className="block text-xs font-medium text-gray-700 mb-1">
            Ihr Verbesserungsvorschlag *
          </label>
          <textarea
            ref={textareaRef}
            id="suggestion"
            className={cn(
              "w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:border-transparent resize-none text-xs transition-colors",
              config.focusRing,
              submitError ? "border-red-500" : "border-gray-300"
            )}
            rows={3}
            maxLength={500}
            placeholder={
              feedbackScope === 'site' ? "Idee für Website..." :
              feedbackScope === 'page' ? "Was soll verbessert werden?" :
              selectedElements.length > 0 ?
                `${selectedElements.length} Element${selectedElements.length > 1 ? 'e' : ''} ausgewählt - Verbesserungsvorschlag?` :
                "Element zuerst auswählen..."
            }
            disabled={feedbackScope === 'element' && selectedElements.length === 0}
            required
          />
          <div className="flex justify-between items-center mt-0.5">
            {feedbackScope === 'element' && selectedElements.length > 0 && (
              <p className="text-xs text-blue-600">
                🎯 {selectedElements.length} Element{selectedElements.length > 1 ? 'e' : ''} ausgewählt
              </p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {textareaRef.current?.value?.length || 0}/500
            </p>
          </div>
          {submitError && (
            <div className="text-red-600 text-xs mt-1">
              {submitError}
            </div>
          )}
        </div>

        <div>
          <input
            ref={contactRef}
            type="text"
            id="contact"
            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-xs"
            placeholder="Name/E-Mail (optional)"
            autoComplete="off"
          />
        </div>

        <div className="flex space-x-1.5">
          <button
            type="submit"
            disabled={isSubmitting || !textareaRef.current?.value?.trim() || (feedbackScope === 'element' && selectedElements.length === 0)}
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
            className="px-2 py-1 text-xs rounded border-gray-300 hover:bg-gray-50 border"
          >
            Abbrechen
          </button>
        </div>

        <div className="text-xs text-gray-400 text-center">
          💡 ESC schliesst • Ctrl+Enter sendet
        </div>
      </form>
    )
  }

  // Main render
  if (isExpanded) {
    return (
      <>
        {/* Global styles for selected elements */}
        <style jsx global>{`
          .suggestion-hover-element {
            outline: 2px dashed #3b82f6 !important;
            outline-offset: 2px !important;
            cursor: crosshair !important;
          }
          .suggestion-selected-element {
            position: relative;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6) !important;
            border: 3px solid #3b82f6 !important;
            border-radius: 6px !important;
            transition: all 0.2s ease-in-out !important;
            transform: scale(1.02) !important;
            z-index: 100 !important;
          }
          .suggestion-selected-element::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            background: linear-gradient(45deg, #3b82f6, #06b6d4);
            border-radius: 8px;
            z-index: -1;
            opacity: 0.3;
          }
          .suggestion-selected-element::after {
            content: '✓';
            position: absolute;
            top: -12px;
            right: -12px;
            background: linear-gradient(45deg, #10b981, #059669);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            z-index: 1001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 2px solid white;
          }
          .suggestion-selected-element:hover {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.4) !important;
          }
        `}</style>

        {/* Backdrop - Only show when panel is open */}
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
              background: 'rgba(59,130,246,0.06)',
              pointerEvents: 'none'
            }}
          >
            <div className="absolute top-20 left-4 sm:left-4 right-4 sm:right-auto bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-xs sm:max-w-xs">
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
                  {selectedElements.length > 0 && (
                    <div className="text-xs opacity-75 mt-2 max-w-full">
                      <div className="font-medium mb-1">Ausgewählte Elemente:</div>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {selectedElements.slice(0, 3).map((el, index) => (
                          <div key={index} className="bg-blue-500 bg-opacity-30 rounded px-2 py-1 text-xs truncate">
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
                className="bg-green-600 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation"
                style={{ pointerEvents: 'auto' }}
              >
                ✅ Fertig ({selectedElements.length})
              </button>
              <button
                onClick={() => {
                  setIsElementSelectionMode(false)
                  resetToPageScope()
                }}
                className="bg-gray-600 text-white px-4 py-3 sm:px-3 sm:py-2 rounded-lg shadow-lg text-sm font-medium hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation"
                style={{ pointerEvents: 'auto' }}
              >
                ❌ Abbrechen
              </button>
            </div>
          </div>
        )}

        {/* Side Panel */}
        <div
          className="fixed z-[70] sm:right-4 sm:top-20 bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:bottom-auto"
          style={{
            maxHeight: 'calc(100vh - 5rem)'
          }}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggestion-panel-title"
            data-suggestion-panel
            className={cn(
              "bg-white shadow-2xl border border-gray-200 rounded-2xl sm:rounded-l-2xl overflow-hidden flex flex-col max-h-[calc(100vh-8rem)] sm:max-h-[70vh] h-auto",
              // Mobile: full width with margins, desktop: fixed width
              "w-[calc(100%-2rem)] max-w-sm sm:w-80 md:w-96",
              isElementSelectionMode && "ring-2 ring-blue-500 ring-opacity-50 pointer-events-auto"
            )}
            style={{
              pointerEvents: 'auto'
            }}
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
                  onClick={closePanelAndReset}
                  className="text-gray-400 hover:text-gray-600 active:bg-gray-200 transition-colors p-2 sm:p-1 hover:bg-gray-100 rounded-full touch-manipulation"
                  aria-label="Panel schliessen"
                >
                  <X className="w-5 h-5 sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-600">
                Aktuelle Seite: <span className="font-medium text-gray-900">
                  {getCurrentPageInfo().path === '/' ? 'Startseite' : getCurrentPageInfo().title}
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
              <a
                href="/revamp-ux#wie-funktioniert"
                className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center space-x-1 justify-center"
              >
                <Info className="w-3 h-3" />
                <span>Wie funktioniert's?</span>
              </a>
            </div>
          </div>
        </div>
      </>
    )
  }

  // Floating Button
  return (
    <div className="fixed z-[75] sm:right-4 sm:top-1/2 sm:-translate-y-1/2 right-4 top-20">
      <button
        onClick={() => { setIsExpanded(true); uiEvents.emit('openSuggestion') }}
        className={cn(
          "group relative",
          "bg-green-100 hover:bg-green-600 text-green-600 hover:text-white",
          "w-12 h-12 sm:w-12 sm:h-12 rounded-full shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
          "flex items-center justify-center",
          "border-2 border-white shadow-black/10",
          "hover:scale-110 active:scale-95 touch-manipulation",
          isExpanded && "ring-2 ring-green-500 ring-offset-2"
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