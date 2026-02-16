/**
 * Generic AI Extraction Service
 *
 * Provider-agnostic extraction layer using centralized provider cascade.
 * Used by form-specific extraction services (erfassung, it-hilfe, etc.)
 */

import { logger } from '@/lib/logger'
import { callWithFallback, extractJson } from '@/lib/ai/providers'

// =============================================================================
// TYPES
// =============================================================================

export interface AIExtractionConfig {
  formType: string
  systemPrompt: string
  userPrompt: string
  parseResponse: (raw: unknown) => Record<string, unknown>
}

export interface AIExtractionResult {
  success: true
  data: Record<string, unknown>
  model: string
}

export interface AIExtractionError {
  success: false
  error: string
  rawResponse?: string
}

export type ExtractResult = AIExtractionResult | AIExtractionError

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Try providers in cascade: Groq → OpenRouter → Ollama → null
 */
export async function extractWithFallback(
  config: AIExtractionConfig,
): Promise<ExtractResult> {
  const result = await callWithFallback({
    systemPrompt: config.systemPrompt,
    userPrompt: config.userPrompt,
    maxTokens: 1024,
    timeoutMs: 15000,
  })

  if (!result) {
    return { success: false, error: 'Kein KI-Service erreichbar. Bitte prüfen Sie die Konfiguration.' }
  }

  const raw = extractJson(result.text, /\{[\s\S]*\}/)
  if (!raw) {
    logger.warn('No JSON in AI extraction response', {
      formType: config.formType,
      provider: result.provider,
      responsePreview: result.text.substring(0, 200),
    })
    return { success: false, error: 'KI-Antwort enthielt kein gültiges JSON.', rawResponse: result.text.substring(0, 500) }
  }

  try {
    const data = config.parseResponse(raw)
    logger.info('AI extraction successful', {
      formType: config.formType,
      provider: result.provider,
      model: result.model,
      fallbacks: result.failedProviders.length,
    })
    return { success: true, data, model: result.model }
  } catch (error) {
    logger.warn('Failed to parse AI response', {
      error,
      formType: config.formType,
      provider: result.provider,
    })
    return { success: false, error: 'KI-Antwort konnte nicht verarbeitet werden.' }
  }
}
