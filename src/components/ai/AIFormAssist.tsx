'use client'

/**
 * AIFormAssist — Unified AI form assistance component.
 *
 * Replaces AIFormAssistBar, BlogAIModal, and AIRefinementSection with a single,
 * consistent UX. Reads quick actions from FORM_AI_REGISTRY (SSOT).
 *
 * Three-layer progressive disclosure:
 *   Layer 1: Collapsible header (always visible)
 *   Layer 2: Quick actions (one-click common operations)
 *   Layer 3: Text input (describe what to create / custom instruction)
 */

import { useState, type KeyboardEvent } from 'react'
import { Sparkles, Wand2, ChevronDown, ChevronUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAIFormAssist, type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { FORM_AI_REGISTRY } from '@/lib/ai/config/prompts'

interface AIFormAssistProps<T = Record<string, unknown>> {
  /** Registry key from FORM_AI_REGISTRY */
  formType: string
  /** Current form data — enables refine mode + quick actions */
  currentData?: Record<string, unknown>
  /** Callback when AI fills/updates fields */
  onFieldsFilled: (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => void
  /** Placeholder text for the input textarea */
  placeholder?: string
  /** Start expanded (default: false) */
  defaultExpanded?: boolean
  /** Visual variant: 'bar' = compact, 'section' = prominent gradient (erfassung-style) */
  variant?: 'bar' | 'section'
  /** Additional CSS class */
  className?: string
}

export function AIFormAssist<T = Record<string, unknown>>({
  formType,
  currentData,
  onFieldsFilled,
  placeholder,
  defaultExpanded = false,
  variant = 'bar',
  className = '',
}: AIFormAssistProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [inputText, setInputText] = useState('')

  const { extractFromText, refineFields, runQuickAction, isExtracting, error, success } =
    useAIFormAssist<T>({ formType, onFieldsFilled })

  const config = FORM_AI_REGISTRY[formType]
  if (!config) return null

  // Derive quick actions from registry
  const quickActions = config.quickActions
    ? Object.entries(config.quickActions).map(([key, { label }]) => ({ key, label }))
    : []

  // Auto-detect mode: refine if form has data AND registry supports it
  const hasData = currentData && Object.values(currentData).some(v => v !== '' && v != null)
  const isRefineMode = !!(hasData && config.refine)

  // Show quick actions when: in refine mode, has quick actions, and has current data
  const showQuickActions = isRefineMode && quickActions.length > 0 && !!currentData

  const handleSubmit = () => {
    if (!inputText.trim() || isExtracting) return
    if (isRefineMode && currentData) {
      refineFields(currentData, inputText)
    } else {
      extractFromText(inputText)
    }
    setInputText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickAction = (actionKey: string) => {
    if (!currentData || isExtracting) return
    runQuickAction(currentData, actionKey)
  }

  // Variant styles
  const containerClass = variant === 'section'
    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700'
    : 'rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'

  const headerPadding = variant === 'section' ? 'px-4 sm:px-6 py-3' : 'px-4 py-2.5'
  const contentPadding = variant === 'section' ? 'px-4 sm:px-6 pb-4 sm:pb-6' : 'px-4 pb-3'

  // Divider needs matching background for seamless text overlay
  const dividerBg = variant === 'section'
    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20'
    : 'bg-purple-50 dark:bg-purple-900/20'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Layer 1: Header (always visible) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${headerPadding} text-left`}
      >
        <span className="text-sm sm:text-base font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          {isRefineMode
            ? <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
            : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          }
          {isRefineMode ? 'Mit KI verbessern' : 'KI-Assistent'}
        </span>
        {isExpanded
          ? <ChevronUp className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          : <ChevronDown className="w-5 h-5 text-purple-500 dark:text-purple-400" />
        }
      </button>

      {isExpanded && (
        <div className={`${contentPadding} space-y-3`}>
          {/* Feedback: error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback: success */}
          {success && !error && (
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-3 py-2 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Felder ausgefüllt!</span>
            </div>
          )}

          {/* Layer 2: Quick actions */}
          {showQuickActions && (
            <div>
              <label className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2 block">
                Schnellaktionen
              </label>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleQuickAction(action.key)}
                    disabled={isExtracting}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-700/50 disabled:opacity-50 transition-colors touch-manipulation"
                  >
                    <Sparkles className="w-3 h-3" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* "oder" divider (when both quick actions and text input shown) */}
          {showQuickActions && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-200 dark:border-purple-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className={`px-2 ${dividerBg} text-purple-500 dark:text-purple-400`}>
                  oder
                </span>
              </div>
            </div>
          )}

          {/* Layer 3: Text input */}
          <div>
            {showQuickActions && (
              <label className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1.5 block">
                Eigene Anweisung
              </label>
            )}
            <div className="flex gap-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder || (isRefineMode
                  ? 'z.B. "Ergänze fehlende Spezifikationen" oder "Mache die Beschreibung ansprechender"'
                  : 'Beschreibe in 1-2 Sätzen und die KI füllt die Felder aus.'
                )}
                rows={2}
                disabled={isExtracting}
                className="flex-1 px-3 py-2 text-sm border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isExtracting || !inputText.trim()}
                className="px-3 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors touch-manipulation"
              >
                {isExtracting
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : isRefineMode
                    ? <Wand2 className="w-5 h-5" />
                    : <Sparkles className="w-5 h-5" />
                }
              </button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-purple-500 dark:text-purple-400">
            {isRefineMode
              ? 'Beschreibe, was verbessert werden soll, oder nutze die Schnellaktionen oben.'
              : 'Beschreibe in 1-2 Sätzen und die KI füllt die Felder aus. Enter zum Absenden.'
            }
          </p>
        </div>
      )}
    </div>
  )
}
