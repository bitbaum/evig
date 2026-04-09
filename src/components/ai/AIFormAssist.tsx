'use client'

/**
 * AIFormAssist — Unified AI form assistance component.
 *
 * Single input field that always does the right thing:
 * - Empty form: user describes what they want → AI creates/fills fields
 * - Filled form: user describes what to change → AI refines fields
 * - Quick actions: one-click shortcuts, always available
 *
 * Reads config from FORM_AI_REGISTRY (SSOT).
 */

import { useState, type KeyboardEvent } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
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
  /** Visual variant: 'bar' = compact, 'section' = prominent */
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

  // Quick actions from registry — always available
  const quickActions = config.quickActions
    ? Object.entries(config.quickActions).map(([key, { label }]) => ({ key, label }))
    : []

  // Detect if form has meaningful content (for choosing extract vs refine)
  const hasContent = currentData && Object.values(currentData).some(v =>
    typeof v === 'string' && v.trim().length > 20
  )

  const handleSubmit = () => {
    if (!inputText.trim() || isExtracting) return
    if (hasContent && currentData) {
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
    if (isExtracting) return
    // Quick actions work with current data if available, empty object if not
    runQuickAction(currentData || {}, actionKey)
  }

  // Styles
  const containerClass = variant === 'section'
    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700'
    : 'rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'

  const padding = variant === 'section' ? 'px-4 sm:px-6' : 'px-4'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${padding} py-2.5 text-left`}
      >
        <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          KI-Assistent
        </span>
        <svg className={`w-4 h-4 text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className={`${padding} pb-4 space-y-3`}>
          {/* Feedback */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && !error && (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Felder ausgefüllt!</span>
            </div>
          )}

          {/* Text input — the primary interaction */}
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || 'Beschreibe in 1-2 Sätzen, die KI füllt das Formular aus...'}
              rows={2}
              disabled={isExtracting}
              className="flex-1 px-3 py-2 text-sm border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isExtracting || !inputText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors touch-manipulation self-end"
            >
              {isExtracting
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Sparkles className="w-5 h-5" />
              }
            </button>
          </div>

          {/* Quick actions — always available, context-aware */}
          {quickActions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => handleQuickAction(action.key)}
                  disabled={isExtracting}
                  className="px-2.5 py-1 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-700/50 disabled:opacity-50 transition-colors touch-manipulation"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
