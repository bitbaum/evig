/**
 * Generic AI Extraction Service
 *
 * Provider-agnostic extraction layer using centralized provider cascade.
 * Used by form-specific extraction services (erfassung, it-hilfe, etc.)
 * and the universal /api/ai/extract endpoint.
 */

import { logger } from '@/lib/logger'
import { callWithFallback, extractJson } from '@/lib/ai/providers'
import { FORM_AI_REGISTRY, fillPromptTemplate, type FormAIConfig } from '@/lib/ai/config/prompts'

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
  provider: string
  confidence: Record<string, number>
}

export interface AIExtractionError {
  success: false
  error: string
  rawResponse?: string
}

export type ExtractResult = AIExtractionResult | AIExtractionError

// =============================================================================
// ROBUST JSON PARSER
// =============================================================================

/**
 * Extract JSON from AI response text robustly.
 * Handles: markdown code blocks, literal newlines in strings, malformed JSON.
 */
export function robustJsonExtract<T = Record<string, unknown>>(text: string): T | null {
  if (!text) return null

  // Limit input to prevent ReDoS on extremely large responses
  const maxLen = 100_000
  const bounded = text.length > maxLen ? text.substring(0, maxLen) : text

  // 1. Strip markdown code block wrappers
  let cleaned = bounded
  const codeBlockMatch = bounded.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  // 2. Try standard JSON.parse on the first object found
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null

  try {
    return JSON.parse(jsonMatch[0]) as T
  } catch {
    // Continue to fallback
  }

  // 3. Handle literal newlines in string values (common with markdown content)
  // Replace actual newlines inside JSON string values with \n
  try {
    const fixed = jsonMatch[0].replace(
      /("(?:[^"\\]|\\.)*")|(\n)/g,
      (match, quoted, newline) => {
        if (quoted) return quoted
        return '\\n'
      }
    )
    return JSON.parse(fixed) as T
  } catch {
    // Continue to field extraction
  }

  // 4. Regex fallback: extract key-value pairs from malformed JSON
  try {
    const result: Record<string, unknown> = {}
    const raw = jsonMatch[0]
    const MAX_ITERATIONS = 500  // Safety bound

    // Extract string fields
    const stringPattern = /"(\w+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g
    let match
    let iterations = 0
    while ((match = stringPattern.exec(raw)) !== null && ++iterations < MAX_ITERATIONS) {
      result[match[1]] = match[2].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t')
    }

    // Extract array fields
    const arrayPattern = /"(\w+)"\s*:\s*\[((?:[^\]])*)\]/g
    iterations = 0
    while ((match = arrayPattern.exec(raw)) !== null && ++iterations < MAX_ITERATIONS) {
      const items: string[] = []
      const itemPattern = /"([^"]+)"/g
      let itemMatch
      let innerIterations = 0
      while ((itemMatch = itemPattern.exec(match[2])) !== null && ++innerIterations < MAX_ITERATIONS) {
        items.push(itemMatch[1])
      }
      result[match[1]] = items
    }

    // Extract number fields
    const numPattern = /"(\w+)"\s*:\s*(\d+(?:\.\d+)?)/g
    iterations = 0
    while ((match = numPattern.exec(raw)) !== null && ++iterations < MAX_ITERATIONS) {
      if (!(match[1] in result)) {
        result[match[1]] = Number(match[2])
      }
    }

    // Extract boolean fields
    const boolPattern = /"(\w+)"\s*:\s*(true|false)/g
    iterations = 0
    while ((match = boolPattern.exec(raw)) !== null && ++iterations < MAX_ITERATIONS) {
      if (!(match[1] in result)) {
        result[match[1]] = match[2] === 'true'
      }
    }

    if (Object.keys(result).length > 0) {
      return result as T
    }
  } catch {
    // All parsing failed
  }

  return null
}

// =============================================================================
// CONFIDENCE CALCULATION
// =============================================================================

/**
 * Generic confidence calculation: check if field values were mentioned in input text.
 */
export function calculateGenericConfidence(
  inputText: string,
  data: Record<string, unknown>
): Record<string, number> {
  const inputLower = inputText.toLowerCase()
  const confidence: Record<string, number> = {}

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined || value === '') {
      continue
    }

    if (typeof value === 'string') {
      // Check if significant words from the value appear in input
      const words = value.toLowerCase().split(/\s+/).filter(w => w.length > 2)
      const mentionedCount = words.filter(w => inputLower.includes(w)).length
      confidence[key] = words.length > 0
        ? Math.min(0.95, 0.5 + (mentionedCount / words.length) * 0.45)
        : 0.6
    } else if (Array.isArray(value)) {
      confidence[key] = 0.65
    } else {
      confidence[key] = 0.7
    }
  }

  return confidence
}

// =============================================================================
// REGISTRY-BASED EXTRACTION
// =============================================================================

export type ExtractMode = 'extract' | 'generate' | 'refine'

interface RegistryExtractOptions {
  formType: string
  text: string
  mode?: ExtractMode
  currentData?: Record<string, unknown>
  instruction?: string
  quickAction?: string
}

/**
 * Extract/generate/refine form data using the FORM_AI_REGISTRY.
 * Looks up prompts by formType, calls AI, returns parsed data with confidence.
 */
export async function registryExtract(
  opts: RegistryExtractOptions
): Promise<ExtractResult> {
  const config = FORM_AI_REGISTRY[opts.formType]
  if (!config) {
    return { success: false, error: `Unbekannter Formulartyp: ${opts.formType}` }
  }

  const mode = opts.mode || 'extract'

  // Safely serialize currentData with size bound
  const safeCurrentData = (() => {
    try {
      const json = JSON.stringify(opts.currentData || {}, null, 2)
      return json.length > 10_000 ? json.substring(0, 10_000) + '\n...(abgeschnitten)' : json
    } catch {
      return '{}'
    }
  })()

  // Build the user prompt based on mode
  let userPrompt: string
  if (mode === 'refine' && config.refine && opts.instruction) {
    userPrompt = fillPromptTemplate(config.refine, {
      currentData: safeCurrentData,
      instruction: opts.instruction,
    })
  } else if (mode === 'refine' && opts.quickAction && config.quickActions?.[opts.quickAction]) {
    userPrompt = fillPromptTemplate(config.refine || config.extract, {
      currentData: safeCurrentData,
      instruction: config.quickActions[opts.quickAction],
    })
  } else {
    userPrompt = fillPromptTemplate(config.extract, {
      text: opts.text,
      schema: config.schema || '',
    })
  }

  const result = await callWithFallback({
    systemPrompt: config.system,
    userPrompt,
    temperature: config.temperature ?? 0.3,
    maxTokens: config.maxTokens ?? 1024,
    timeoutMs: 15000,
  })

  if (!result) {
    return { success: false, error: 'Kein KI-Service erreichbar. Bitte prüfen Sie die Konfiguration.' }
  }

  const parsed = robustJsonExtract(result.text)
  if (!parsed) {
    logger.warn('No JSON in AI extraction response', {
      formType: opts.formType,
      provider: result.provider,
      responsePreview: result.text.substring(0, 200),
    })
    return { success: false, error: 'KI-Antwort enthielt kein gültiges JSON.', rawResponse: result.text.substring(0, 500) }
  }

  const data = parsed as Record<string, unknown>
  const confidence = calculateGenericConfidence(opts.text, data)

  logger.info('Registry extraction successful', {
    formType: opts.formType,
    mode,
    provider: result.provider,
    model: result.model,
    fieldCount: Object.keys(data).length,
  })

  return {
    success: true,
    data,
    model: result.model,
    provider: result.provider,
    confidence,
  }
}

// =============================================================================
// LEGACY API (used by it-hilfe)
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
    return { success: true, data, model: result.model, provider: result.provider, confidence: {} }
  } catch (error) {
    logger.warn('Failed to parse AI response', {
      error,
      formType: config.formType,
      provider: result.provider,
    })
    return { success: false, error: 'KI-Antwort konnte nicht verarbeitet werden.' }
  }
}
