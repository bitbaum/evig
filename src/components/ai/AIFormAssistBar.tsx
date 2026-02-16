'use client'

/**
 * AIFormAssistBar Component
 *
 * Reusable AI assistance bar for any form.
 * Drop into a form component to add AI-powered field filling.
 *
 * Usage:
 *   <AIFormAssistBar
 *     formType="marketplace"
 *     placeholder="Beschreibe dein Produkt..."
 *     onFieldsFilled={(data) => { update form state }}
 *   />
 */

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useAIFormAssist, type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'

interface QuickAction {
  key: string
  label: string
}

interface AIFormAssistBarProps<T = Record<string, unknown>> {
  formType: string
  placeholder?: string
  onFieldsFilled: (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => void
  quickActions?: QuickAction[]
  currentData?: Record<string, unknown>
  className?: string
}

export function AIFormAssistBar<T = Record<string, unknown>>({
  formType,
  placeholder = 'Beschreibe kurz, was du erstellen möchtest...',
  onFieldsFilled,
  quickActions,
  currentData,
  className = '',
}: AIFormAssistBarProps<T>) {
  const [inputText, setInputText] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const { extractFromText, runQuickAction, isExtracting, error, success } = useAIFormAssist<T>({
    formType,
    onFieldsFilled,
  })

  const handleExtract = async () => {
    await extractFromText(inputText)
    // Don't clear input so user can refine
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleExtract()
    }
  }

  const handleQuickAction = async (actionKey: string) => {
    if (!currentData) return
    await runQuickAction(currentData, actionKey)
  }

  return (
    <div className={`rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 ${className}`}>
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300">
          <Sparkles className="w-4 h-4" />
          KI-Assistent
        </div>
        {isExpanded
          ? <ChevronUp className="w-4 h-4 text-purple-500" />
          : <ChevronDown className="w-4 h-4 text-purple-500" />
        }
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Text input */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              disabled={isExtracting}
              className="w-full px-3 py-2 text-sm border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>

          {/* Extract button */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExtract}
              disabled={isExtracting || !inputText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Verarbeite...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Felder ausfüllen
                </>
              )}
            </button>

            {/* Quick action buttons */}
            {quickActions && quickActions.length > 0 && currentData && (
              <>
                <span className="text-xs text-purple-400">|</span>
                {quickActions.map((action) => (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => handleQuickAction(action.key)}
                    disabled={isExtracting}
                    className="px-2.5 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 disabled:opacity-50 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </>
            )}
          </div>

          {/* Status display */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && !error && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Felder ausgefüllt!</span>
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-purple-500 dark:text-purple-400">
            Beschreibe in 1-2 Sätzen und die KI füllt die Felder aus. Enter zum Absenden.
          </p>
        </div>
      )}
    </div>
  )
}
