'use client'

/**
 * AIFormAssist — Unified AI form assistance component (SSOT).
 *
 * Single input that always does the right thing:
 * - Empty form → user describes what they want → AI fills fields
 * - Filled form → user describes changes → AI refines fields
 * - Quick actions → one-click shortcuts (only when form has content)
 *
 * Config comes from FORM_AI_REGISTRY. To add AI to a new form:
 * 1. Add entry to FORM_AI_REGISTRY in lib/ai/config/prompts.ts
 * 2. Drop <AIFormAssist formType="xxx" /> in the component
 */

import { useState, type KeyboardEvent } from 'react'
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAIFormAssist, type AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import { FORM_AI_REGISTRY } from '@/lib/ai/config/prompts'

interface AIFormAssistProps<T = Record<string, unknown>> {
  formType: string
  currentData?: Record<string, unknown>
  onFieldsFilled: (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => void
  placeholder?: string
  defaultExpanded?: boolean
  variant?: 'bar' | 'section'
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
  const t = useTranslations('ai.formAssist')
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [inputText, setInputText] = useState('')
  const [filledCount, setFilledCount] = useState(0)

  const wrappedOnFieldsFilled = (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => {
    // Count how many fields were actually filled
    const count = Object.keys(metadata).length
    setFilledCount(count)
    onFieldsFilled(data, metadata)
  }

  const { extractFromText, refineFields, runQuickAction, isExtracting, error, success, suggestedActions } =
    useAIFormAssist<T>({ formType, onFieldsFilled: wrappedOnFieldsFilled })

  const config = FORM_AI_REGISTRY[formType]
  if (!config) return null

  const quickActions = config.quickActions
    ? Object.entries(config.quickActions).map(([key, { label }]) => ({ key, label }))
    : []

  // Form has meaningful user content (not just defaults)
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
    if (isExtracting || !hasContent || !currentData) return
    runQuickAction(currentData, actionKey)
  }

  const handleSuggestedAction = (prompt: string) => {
    if (isExtracting || !currentData) return
    refineFields(currentData, prompt)
  }

  // Styles
  const containerClass = variant === 'section'
    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-purple-200 dark:border-purple-700'
    : 'rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20'

  const padding = variant === 'section' ? 'px-4 sm:px-6' : 'px-4'

  return (
    <div className={`${containerClass} ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between ${padding} py-2.5 text-left`}
      >
        <span className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          {t('heading')}
        </span>
        <svg className={`w-4 h-4 text-purple-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className={`${padding} pb-4 space-y-3`}>
          {/* Error feedback */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success feedback — persistent until next action, shows field count */}
          {success && !error && (
            <div className="flex items-center gap-2 bg-primary-50 border border-primary-200 text-primary-700 px-3 py-2 rounded-lg text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                {filledCount > 0
                  ? t('successCount', { count: filledCount })
                  : t('successGeneric')}
              </span>
            </div>
          )}

          {/* Text input — the primary interaction */}
          <div className="flex gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasContent
                ? t('placeholderRefine')
                : (placeholder || t('placeholderEmpty'))
              }
              rows={2}
              disabled={isExtracting}
              className="flex-1 px-3 py-2 text-sm border border-purple-300 dark:border-purple-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isExtracting || !inputText.trim()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors touch-manipulation self-end"
              aria-label={isExtracting ? t('ariaProcessing') : t('ariaRun')}
            >
              {isExtracting
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Sparkles className="w-5 h-5" />
              }
            </button>
          </div>

          {/* Quick actions: AI-suggested (dynamic) or static from registry */}
          {(suggestedActions.length > 0 || quickActions.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {suggestedActions.length > 0
                ? suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSuggestedAction(action.prompt)}
                      disabled={isExtracting}
                      className="px-2.5 py-1 bg-primary-100 dark:bg-primary-800/40 text-primary-700 dark:text-primary-300 rounded-md text-xs font-medium hover:bg-primary-200 dark:hover:bg-primary-700/50 disabled:opacity-50 transition-colors touch-manipulation"
                    >
                      {action.label}
                    </button>
                  ))
                : quickActions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      onClick={() => handleQuickAction(action.key)}
                      disabled={isExtracting || !hasContent}
                      title={!hasContent ? t('quickActionDisabled') : undefined}
                      className="px-2.5 py-1 bg-purple-100 dark:bg-purple-800/40 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-700/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-manipulation"
                    >
                      {action.label}
                    </button>
                  ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  )
}
