/**
 * Protocol AI Processing
 *
 * Shared AI provider logic for protocol pipeline:
 * - Transcript → structured notes (Step 2)
 * - Notes → structured notes (Step 3, same output)
 * - Task list → parsed tasks (Step 4)
 *
 * Uses Groq (cloud) with Ollama (local) fallback.
 * Validates output with Zod schemas.
 */

import { logger } from '@/lib/logger'
import {
  structuredNotesSchema,
  parsedTaskListSchema,
  proposedTaskListSchema,
  type StructuredNotes,
  type ParsedTaskItem,
  type ProposedTask,
} from '@/lib/schemas/protocols'
import { PROTOCOL_PROMPTS } from '@/lib/ai/config/prompts'

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'
const AI_TIMEOUT_MS = 30000

// =============================================================================
// SHARED AI PROVIDER HELPER (DRY)
// =============================================================================

/**
 * Call an AI provider (Groq or Ollama) and extract JSON from response.
 * Returns raw parsed JSON or null on failure.
 */
async function callAiProvider(
  provider: 'groq' | 'ollama',
  systemPrompt: string,
  userPrompt: string,
  jsonPattern: RegExp,
): Promise<{ raw: unknown; model: string } | null> {
  if (provider === 'groq') {
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
          max_tokens: 4096,
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
      const responseText = result.choices?.[0]?.message?.content || ''

      const jsonMatch = responseText.match(jsonPattern)
      if (!jsonMatch) {
        logger.warn('No JSON in Groq response', { response: responseText.substring(0, 200) })
        return null
      }

      const parsed = JSON.parse(jsonMatch[0])
      return { raw: parsed, model: `groq:${GROQ_MODEL}` }
    } catch (error) {
      clearTimeout(timeoutId)
      const message = error instanceof Error ? error.message : 'unknown'
      logger.warn('Groq processing failed', { error: message })
      return null
    }
  }

  // Ollama provider
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`

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

    const jsonMatch = responseText.match(jsonPattern)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])
    return { raw: parsed, model: `ollama:${OLLAMA_MODEL}` }
  } catch {
    clearTimeout(timeoutId)
    return null
  }
}

/**
 * Try both providers in order: Groq first, Ollama fallback.
 */
async function callWithFallback(
  systemPrompt: string,
  userPrompt: string,
  jsonPattern: RegExp,
): Promise<{ raw: unknown; model: string } | null> {
  const groqResult = await callAiProvider('groq', systemPrompt, userPrompt, jsonPattern)
  if (groqResult) return groqResult

  return callAiProvider('ollama', systemPrompt, userPrompt, jsonPattern)
}

// =============================================================================
// TRANSCRIPT PROCESSING (Step 2)
// =============================================================================

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
  const result = await callWithFallback(
    PROTOCOL_PROMPTS.system,
    prompt,
    /\{[\s\S]*\}/,
  )

  if (!result) return null

  const validated = validateNotes(result.raw)
  if (!validated) return null

  logger.info('Protocol transcript processed', {
    model: result.model,
    topics: validated.topics.length,
    actionItems: validated.action_items.length,
  })

  return { notes: validated, model: result.model }
}

// =============================================================================
// NOTES PROCESSING (Step 3)
// =============================================================================

/**
 * Process semi-structured notes through AI into StructuredNotes.
 * Uses a different system prompt than transcript processing.
 */
export async function processProtocolNotes(
  prompt: string,
): Promise<ProcessingResult | null> {
  const result = await callWithFallback(
    PROTOCOL_PROMPTS.notesSystem,
    prompt,
    /\{[\s\S]*\}/,
  )

  if (!result) return null

  const validated = validateNotes(result.raw)
  if (!validated) return null

  logger.info('Protocol notes processed', {
    model: result.model,
    topics: validated.topics.length,
    actionItems: validated.action_items.length,
  })

  return { notes: validated, model: result.model }
}

// =============================================================================
// TASK LIST PROCESSING (Step 4)
// =============================================================================

interface TaskProcessingResult {
  tasks: ParsedTaskItem[]
  model: string
}

/**
 * Process a plain-text task list through AI and validate output.
 * Returns null if all providers fail or output is invalid.
 */
export async function processTaskList(
  prompt: string,
): Promise<TaskProcessingResult | null> {
  const result = await callWithFallback(
    PROTOCOL_PROMPTS.tasksSystem,
    prompt,
    /\[[\s\S]*\]/,
  )

  if (!result) return null

  const validated = parsedTaskListSchema.safeParse(result.raw)
  if (!validated.success) {
    logger.warn('AI output failed task list validation', {
      errors: validated.error.flatten().fieldErrors,
    })
    return null
  }

  logger.info('Task list processed', {
    model: result.model,
    taskCount: validated.data.length,
  })

  return { tasks: validated.data, model: result.model }
}

// =============================================================================
// DECISION PROPOSAL PROCESSING
// =============================================================================

interface ProposalProcessingResult {
  proposals: ProposedTask[]
  model: string
}

/**
 * Process an AI prompt to generate task proposals from an approved decision.
 * Returns null if all providers fail or output is invalid.
 */
export async function processDecisionProposal(
  prompt: string,
): Promise<ProposalProcessingResult | null> {
  const result = await callWithFallback(
    PROTOCOL_PROMPTS.proposalSystem,
    prompt,
    /\[[\s\S]*\]/,
  )

  if (!result) return null

  const validated = proposedTaskListSchema.safeParse(result.raw)
  if (!validated.success) {
    logger.warn('AI output failed proposal validation', {
      errors: validated.error.flatten().fieldErrors,
    })
    return null
  }

  logger.info('Decision proposals generated', {
    model: result.model,
    proposalCount: validated.data.length,
  })

  return { proposals: validated.data, model: result.model }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate and coerce raw AI JSON into StructuredNotes.
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
