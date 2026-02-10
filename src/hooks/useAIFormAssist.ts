'use client'

/**
 * useAIFormAssist Hook
 *
 * Generic hook for AI-powered form field extraction.
 * Calls POST /api/ai/extract and returns structured data for any form type.
 */

import { useState } from 'react'

export interface AIFieldMetadataEntry {
  confidence: number
  model: string
  timestamp: number
}

export interface UseAIFormAssistOptions<T> {
  formType: 'erfassung' | 'it-hilfe'
  onFieldsFilled: (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => void
}

export interface UseAIFormAssistReturn {
  extractFromText: (text: string) => Promise<void>
  isExtracting: boolean
  error: string | null
}

export function useAIFormAssist<T>({
  formType,
  onFieldsFilled,
}: UseAIFormAssistOptions<T>): UseAIFormAssistReturn {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const extractFromText = async (text: string) => {
    if (!text.trim()) {
      setError('Bitte gib eine Beschreibung ein.')
      return
    }

    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, text }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'KI-Extraktion fehlgeschlagen')
        return
      }

      // Build metadata from confidence scores
      const metadata: Record<string, AIFieldMetadataEntry> = {}
      const confidence = result.confidence || {}
      const timestamp = Date.now()

      for (const [key, value] of Object.entries(confidence)) {
        metadata[key] = {
          confidence: value as number,
          model: result.model || 'unknown',
          timestamp,
        }
      }

      onFieldsFilled(result.data as Partial<T>, metadata)
    } catch {
      setError('Verbindung zum KI-Service fehlgeschlagen.')
    } finally {
      setIsExtracting(false)
    }
  }

  return { extractFromText, isExtracting, error }
}
