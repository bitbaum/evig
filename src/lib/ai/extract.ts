/**
 * Generic AI Extraction Service
 *
 * Provider-agnostic extraction layer: Groq (cloud) → Ollama (local) → null
 * Used by form-specific extraction services (erfassung, it-hilfe, etc.)
 */

import { logger } from '@/lib/logger'

// Provider configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const AI_TIMEOUT_MS = 15000

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
// PROVIDERS
// =============================================================================

/**
 * Call Groq cloud API for JSON extraction
 */
export async function callGroq(
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown> | null> {
  if (!GROQ_API_KEY) {
    logger.info('Groq API key not configured, skipping cloud AI')
    return null
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      logger.warn('Groq API error', { status: response.status, error: errorText })
      return null
    }

    const result = await response.json()
    const text = result.choices?.[0]?.message?.content || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON in Groq response', { response: text.substring(0, 200) })
      return null
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    clearTimeout(timeoutId)
    const message = error instanceof Error ? error.message : 'unknown'
    logger.warn('Groq extraction failed', { error: message })
    return null
  }
}

/**
 * Call Ollama local API for JSON extraction
 */
export async function callOllama(
  systemPrompt: string,
  userPrompt: string,
): Promise<Record<string, unknown> | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        options: { temperature: 0.3, num_predict: 500 },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const result = await response.json()
    const text = result.response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    return JSON.parse(jsonMatch[0])
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

/**
 * Try providers in order: Groq → Ollama → null
 */
export async function extractWithFallback(
  config: AIExtractionConfig,
): Promise<ExtractResult> {
  // 1. Try Groq (cloud)
  const groqRaw = await callGroq(config.systemPrompt, config.userPrompt)
  if (groqRaw) {
    try {
      const data = config.parseResponse(groqRaw)
      logger.info('AI extraction successful via Groq', { formType: config.formType })
      return { success: true, data, model: GROQ_MODEL }
    } catch (error) {
      logger.warn('Failed to parse Groq response', { error, formType: config.formType })
    }
  }

  // 2. Try Ollama (local)
  const ollamaRaw = await callOllama(config.systemPrompt, config.userPrompt)
  if (ollamaRaw) {
    try {
      const data = config.parseResponse(ollamaRaw)
      logger.info('AI extraction successful via Ollama', { formType: config.formType })
      return { success: true, data, model: OLLAMA_MODEL }
    } catch (error) {
      logger.warn('Failed to parse Ollama response', { error, formType: config.formType })
    }
  }

  logger.warn('All AI providers failed', {
    formType: config.formType,
    hasGroqKey: !!GROQ_API_KEY,
  })

  return { success: false, error: 'KI-Service nicht verfügbar. Bitte später versuchen.' }
}

export { GROQ_MODEL, OLLAMA_MODEL }
