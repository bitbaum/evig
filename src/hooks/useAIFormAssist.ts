'use client'

/**
 * useAIFormAssist Hook
 *
 * Generic hook for AI-powered form field extraction, refinement, and quick actions.
 * Calls POST /api/ai/extract and returns structured data for any form type.
 */

import { useState, useRef, useCallback } from 'react'

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
  success: boolean
}

const MAX_INPUT_LENGTH = 5000

export function useAIFormAssist<T>({
  formType,
  onFieldsFilled,
}: UseAIFormAssistOptions<T>): UseAIFormAssistReturn {
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const callAPI = useCallback(async (body: Record<string, unknown>) => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsExtracting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formType, ...body }),
        signal: controller.signal,
      })

      // Don't update state if request was aborted
      if (controller.signal.aborted) return

      let result: Record<string, unknown>
      try {
        result = await response.json()
      } catch {
        setError('Ungültige Antwort vom Server.')
        return
      }

      if (!result.success) {
        setError((result.error as string) || 'KI-Extraktion fehlgeschlagen')
        return
      }

      // Build metadata from confidence scores
      const metadata: Record<string, AIFieldMetadataEntry> = {}
      const confidence = (result.confidence || {}) as Record<string, number>
      const timestamp = Date.now()

      for (const [key, value] of Object.entries(confidence)) {
        metadata[key] = {
          confidence: value,
          model: (result.model as string) || 'unknown',
          timestamp,
        }
      }

      onFieldsFilled(result.data as Partial<T>, metadata)
      setSuccess(true)
      // Clear success indicator after 3s
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Verbindung zum KI-Service fehlgeschlagen.')
    } finally {
      if (!controller.signal.aborted) {
        setIsExtracting(false)
      }
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
    }
  }, [formType, onFieldsFilled])

  const extractFromText = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) {
      setError('Bitte gib eine Beschreibung ein.')
      return
    }
    if (trimmed.length > MAX_INPUT_LENGTH) {
      setError(`Text zu lang (max. ${MAX_INPUT_LENGTH} Zeichen).`)
      return
    }
    await callAPI({ text: trimmed, mode: 'extract' })
  }, [callAPI])

  const refineFields = useCallback(async (currentData: Record<string, unknown>, instruction: string) => {
    if (!instruction.trim()) {
      setError('Bitte gib eine Anweisung ein.')
      return
    }
    await callAPI({ text: instruction, mode: 'refine', currentData, instruction })
  }, [callAPI])

  const runQuickAction = useCallback(async (currentData: Record<string, unknown>, actionKey: string) => {
    await callAPI({ text: actionKey, mode: 'refine', currentData, quickAction: actionKey })
  }, [callAPI])

  return { extractFromText, refineFields, runQuickAction, isExtracting, error, success }
}
