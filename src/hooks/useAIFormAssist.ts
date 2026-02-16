'use client'

/**
 * useAIFormAssist Hook
 *
 * Generic hook for AI-powered form field extraction, refinement, and quick actions.
 * Calls POST /api/ai/extract and returns structured data for any form type.
 */

import { useState } from 'react'

export interface AIFieldMetadataEntry {
  confidence: number
  model: string
  timestamp: number
}

export interface UseAIFormAssistOptions<T> {
  formType: string
  onFieldsFilled: (data: Partial<T>, metadata: Record<string, AIFieldMetadataEntry>) => void
}

export interface UseAIFormAssistReturn {
  extractFromText: (text: string) => Promise<void>
  refineFields: (currentData: Record<string, unknown>, instruction: string) => Promise<void>
  runQuickAction: (currentData: Record<string, unknown>, actionKey: string) => Promise<void>
  isExtracting: boolean
  error: string | null
}

export function useAIFormAssist<T>({
  formType,
  onFieldsFilled,
}: UseAIFormAssistOptions<T>): UseAIFormAssistReturn {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callAPI = async (body: Record<string, unknown>) => {
    setIsExtracting(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, ...body }),
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

  const extractFromText = async (text: string) => {
    if (!text.trim()) {
      setError('Bitte gib eine Beschreibung ein.')
      return
    }
    await callAPI({ text, mode: 'extract' })
  }

  const refineFields = async (currentData: Record<string, unknown>, instruction: string) => {
    if (!instruction.trim()) {
      setError('Bitte gib eine Anweisung ein.')
      return
    }
    await callAPI({ text: instruction, mode: 'refine', currentData, instruction })
  }

  const runQuickAction = async (currentData: Record<string, unknown>, actionKey: string) => {
    await callAPI({ text: actionKey, mode: 'refine', currentData, quickAction: actionKey })
  }

  return { extractFromText, refineFields, runQuickAction, isExtracting, error }
}
