'use client'

/**
 * AIFieldIndicator Component
 *
 * Shows AI extraction status next to form fields:
 * - Confidence score (color-coded badge)
 * - Source type icon (voice/text/image)
 * - Click to show source input text
 */

import { useState } from 'react'
import { Mic, Type, Image, Sparkles, X, ExternalLink } from 'lucide-react'
import type { AIFieldSource } from '@/types/erfassung'
import { formatTime } from '@/lib/date-formats'

interface AIFieldIndicatorProps {
  source: AIFieldSource
  fieldName: string
  className?: string
}

const SOURCE_ICONS = {
  voice: Mic,
  text: Type,
  image: Image,
  database: ExternalLink,
}

const SOURCE_LABELS = {
  voice: 'Spracheingabe',
  text: 'Texteingabe',
  image: 'Bildanalyse',
  database: 'Datenbank',
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'bg-primary-100 text-primary-700 border-primary-300'
  if (confidence >= 0.7) return 'bg-warning-100 text-warning-700 border-warning-300'
  if (confidence >= 0.5) return 'bg-orange-100 text-orange-700 border-orange-300'
  return 'bg-error-100 text-error-700 border-error-300'
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Hoch'
  if (confidence >= 0.7) return 'Mittel'
  if (confidence >= 0.5) return 'Niedrig'
  return 'Unsicher'
}

export function AIFieldIndicator({
  source,
  fieldName,
  className = '',
}: AIFieldIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)

  const Icon = SOURCE_ICONS[source.type]
  const confidencePercent = Math.round(source.confidence * 100)
  const colorClass = getConfidenceColor(source.confidence)
  const confidenceLabel = getConfidenceLabel(source.confidence)

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Badge button */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className={`inline-flex items-center gap-1 px-2 py-1 min-h-[44px] min-w-[44px] rounded border text-xs font-medium transition-all hover:opacity-80 ${colorClass}`}
        title={`KI-Extraktion: ${confidencePercent}% Konfidenz`}
      >
        <Sparkles className="w-3 h-3" />
        <span>{confidencePercent}%</span>
        <Icon className="w-3 h-3" />
      </button>

      {/* Details popover */}
      {showDetails && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />

          {/* Popover */}
          <div className="absolute left-0 top-full mt-1 z-50 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-neutral-900 dark:text-white text-sm">
                  KI-Extraktion
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2 text-sm">
              {/* Confidence */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Konfidenz:</span>
                <span className={`px-2 py-0.5 rounded ${colorClass}`}>
                  {confidencePercent}% ({confidenceLabel})
                </span>
              </div>

              {/* Source type */}
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">Quelle:</span>
                <span className="flex items-center gap-1 text-neutral-900 dark:text-white">
                  <Icon className="w-4 h-4" />
                  {SOURCE_LABELS[source.type]}
                </span>
              </div>

              {/* Model */}
              {source.model && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Modell:</span>
                  <code className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-xs">
                    {source.model}
                  </code>
                </div>
              )}

              {/* Source input */}
              {source.inputText && (
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-600 dark:text-neutral-400 block mb-1">
                    Eingabe:
                  </span>
                  <div className="bg-neutral-50 dark:bg-neutral-900 rounded p-2 text-xs text-neutral-700 dark:text-neutral-300 max-h-20 overflow-y-auto">
                    &ldquo;{source.inputText}&rdquo;
                  </div>
                </div>
              )}

              {/* Verification sources */}
              {source.sources && source.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-neutral-600 dark:text-neutral-400 block mb-1.5 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Quellen prüfen:
                  </span>
                  <div className="space-y-1">
                    {source.sources.map((verifySource, idx) => (
                      <a
                        key={idx}
                        href={verifySource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline bg-primary-50 dark:bg-primary-900/20 rounded px-2 py-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{verifySource.title}</span>
                        <span className="text-neutral-500 text-[10px] ml-auto flex-shrink-0">
                          {verifySource.type}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamp */}
              <div className="text-xs text-neutral-500 mt-2">
                Extrahiert: {formatTime(new Date(source.timestamp))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Compact inline version for use in form labels
 */
export function AIFieldBadge({
  source,
  className = '',
}: {
  source: AIFieldSource
  className?: string
}) {
  const Icon = SOURCE_ICONS[source.type]
  const confidencePercent = Math.round(source.confidence * 100)
  const colorClass = getConfidenceColor(source.confidence)

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${colorClass} ${className}`}
      title={`KI: ${confidencePercent}% (${SOURCE_LABELS[source.type]})`}
    >
      <Sparkles className="w-2.5 h-2.5" />
      {confidencePercent}%
    </span>
  )
}
