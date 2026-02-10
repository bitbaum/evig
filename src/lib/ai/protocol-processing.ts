/**
 * Protocol AI Processing
 *
 * Transcript → structured notes via Groq (cloud) or Ollama (local).
 * Uses higher token limits than generic extract.ts (transcripts are longer).
 * Validates output with structuredNotesSchema.
 */

import { logger } from '@/lib/logger'
import { structuredNotesSchema, type StructuredNotes } from '@/lib/schemas/protocols'
import { PROTOCOL_PROMPTS } from '@/lib/ai/config/prompts'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const AI_TIMEOUT_MS = 30000

interface ProcessingResult {
  notes: StructuredNotes
  model: string
}

/**
 * Process a protocol transcript through AI and validate output.
 * Returns null if all providers fail or output is invalid.
 */
export async function processProtocolTranscript(
  prompt: string,
): Promise<ProcessingResult | null> {
  // Try Groq first
  const groqResult = await tryGroqProcessing(prompt)
  if (groqResult) {
    const validated = validateNotes(groqResult)
    if (validated) {
      return { notes: validated, model: `groq:${GROQ_MODEL}` }
    }
  }

  // Fallback to Ollama
  const ollamaResult = await tryOllamaProcessing(prompt)
  if (ollamaResult) {
    const validated = validateNotes(ollamaResult)
    if (validated) {
      return { notes: validated, model: `ollama:${OLLAMA_MODEL}` }
    }
  }

  return null
}

/**
 * Validate and coerce raw AI JSON into StructuredNotes.
 * Returns null on failure (logs warning).
 */
function validateNotes(raw: unknown): StructuredNotes | null {
  const result = structuredNotesSchema.safeParse(raw)
  if (!result.success) {
    logger.warn('AI output failed StructuredNotes validation', {
      errors: result.error.flatten().fieldErrors,
    })
    return null
  }
  return result.data
}

/**
 * Try Groq API for transcript processing
 */
async function tryGroqProcessing(prompt: string): Promise<unknown | null> {
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
          { role: 'system', content: PROTOCOL_PROMPTS.system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      logger.warn('Groq API error for protocol processing', { status: response.status, error: errorText })
      return null
    }

    const result = await response.json()
    const responseText = result.choices?.[0]?.message?.content || ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      logger.warn('No JSON in Groq protocol response', { response: responseText.substring(0, 200) })
      return null
    }

    const parsed = JSON.parse(jsonMatch[0])
    logger.info('Groq protocol processing successful', {
      topics: parsed.topics?.length || 0,
      actionItems: parsed.action_items?.length || 0,
    })
    return parsed
  } catch (error) {
    clearTimeout(timeoutId)
    const message = error instanceof Error ? error.message : 'unknown'
    logger.warn('Groq protocol processing failed', { error: message })
    return null
  }
}

/**
 * Try Ollama API for transcript processing
 */
async function tryOllamaProcessing(prompt: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const fullPrompt = `${PROTOCOL_PROMPTS.system}\n\n${prompt}`

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        options: { temperature: 0.3, num_predict: 4096 },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) return null

    const result = await response.json()
    const responseText = result.response

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    logger.info('Ollama protocol processing successful', {
      topics: parsed.topics?.length || 0,
      actionItems: parsed.action_items?.length || 0,
    })
    return parsed
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}
