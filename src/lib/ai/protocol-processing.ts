/**
 * Protocol AI Processing
 *
 * Shared AI provider logic for protocol pipeline:
 * - Transcript → structured notes (Step 2)
 * - Notes → structured notes (Step 3, same output)
 * - Task list → parsed tasks (Step 4)
 *
 * Uses centralized provider cascade: Groq → OpenRouter → Ollama.
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
import { callWithFallback, extractJson, buildFailureMessage } from '@/lib/ai/providers'

// =============================================================================
// TRANSCRIPT PROCESSING (Step 2)
// =============================================================================

interface ProcessingResult {
  notes: StructuredNotes
  model: string
  provider: string
  failureDetails?: string
}

interface ProcessingFailure {
  error: string
  retryable: boolean
  code: 'NO_PROVIDER' | 'INVALID_JSON' | 'INVALID_SCHEMA'
}

export type TranscriptProcessingOutcome =
  | { success: true; result: ProcessingResult }
  | { success: false; failure: ProcessingFailure }

/**
 * Process a protocol transcript through AI and validate output.
 * Returns explicit failure metadata for API/UI handling.
 */
export async function processProtocolTranscript(
  prompt: string,
): Promise<TranscriptProcessingOutcome> {
  const result = await callWithFallback({
    systemPrompt: PROTOCOL_PROMPTS.system,
    userPrompt: prompt,
  })

  if (!result) {
    return {
      success: false,
      failure: {
        code: 'NO_PROVIDER',
        retryable: true,
        error: 'Kein KI-Service erreichbar. Bitte in Admin > Hirn Provider und API-Schlüssel prüfen.',
      },
    }
  }

  const raw = extractJson(result.text, /\{[\s\S]*\}/)
  if (!raw) {
    logger.warn('No JSON in AI response for transcript processing', {
      provider: result.provider,
      responsePreview: result.text.substring(0, 200),
    })
    return {
      success: false,
      failure: {
        code: 'INVALID_JSON',
        retryable: true,
        error: 'KI-Antwort enthielt kein gültiges JSON. Bitte erneut versuchen.',
      },
    }
  }

  const validated = validateNotes(raw)
  if (!validated) {
    return {
      success: false,
      failure: {
        code: 'INVALID_SCHEMA',
        retryable: true,
        error: 'KI-Antwort entsprach nicht dem erwarteten Protokoll-Format. Bitte erneut versuchen.',
      },
    }
  }

  logger.info('Protocol transcript processed', {
    model: result.model,
    provider: result.provider,
    topics: validated.topics.length,
    actionItems: validated.action_items.length,
    fallbacks: result.failedProviders.length,
  })

  return {
    success: true,
    result: {
      notes: validated,
      model: result.model,
      provider: result.provider,
      failureDetails: result.failedProviders.length > 0
        ? buildFailureMessage(result.failedProviders)
        : undefined,
    },
  }
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
  const result = await callWithFallback({
    systemPrompt: PROTOCOL_PROMPTS.notesSystem,
    userPrompt: prompt,
  })

  if (!result) return null

  const raw = extractJson(result.text, /\{[\s\S]*\}/)
  if (!raw) {
    logger.warn('No JSON in AI response for notes processing', {
      provider: result.provider,
    })
    return null
  }

  const validated = validateNotes(raw)
  if (!validated) return null

  logger.info('Protocol notes processed', {
    model: result.model,
    provider: result.provider,
    topics: validated.topics.length,
    actionItems: validated.action_items.length,
  })

  return {
    notes: validated,
    model: result.model,
    provider: result.provider,
  }
}

// =============================================================================
// TASK LIST PROCESSING (Step 4)
// =============================================================================

interface TaskProcessingResult {
  tasks: ParsedTaskItem[]
  model: string
  provider: string
}

/**
 * Process a plain-text task list through AI and validate output.
 * Returns null if all providers fail or output is invalid.
 */
export async function processTaskList(
  prompt: string,
): Promise<TaskProcessingResult | null> {
  const result = await callWithFallback({
    systemPrompt: PROTOCOL_PROMPTS.tasksSystem,
    userPrompt: prompt,
  })

  if (!result) return null

  const raw = extractJson(result.text, /\[[\s\S]*\]/)
  if (!raw) return null

  const validated = parsedTaskListSchema.safeParse(raw)
  if (!validated.success) {
    logger.warn('AI output failed task list validation', {
      errors: validated.error.flatten().fieldErrors,
    })
    return null
  }

  logger.info('Task list processed', {
    model: result.model,
    provider: result.provider,
    taskCount: validated.data.length,
  })

  return { tasks: validated.data, model: result.model, provider: result.provider }
}

// =============================================================================
// DECISION PROPOSAL PROCESSING
// =============================================================================

interface ProposalProcessingResult {
  proposals: ProposedTask[]
  model: string
  provider: string
}

/**
 * Process an AI prompt to generate task proposals from an approved decision.
 * Returns null if all providers fail or output is invalid.
 */
export async function processDecisionProposal(
  prompt: string,
): Promise<ProposalProcessingResult | null> {
  const result = await callWithFallback({
    systemPrompt: PROTOCOL_PROMPTS.proposalSystem,
    userPrompt: prompt,
  })

  if (!result) return null

  const raw = extractJson(result.text, /\[[\s\S]*\]/)
  if (!raw) return null

  const validated = proposedTaskListSchema.safeParse(raw)
  if (!validated.success) {
    logger.warn('AI output failed proposal validation', {
      errors: validated.error.flatten().fieldErrors,
    })
    return null
  }

  logger.info('Decision proposals generated', {
    model: result.model,
    provider: result.provider,
    proposalCount: validated.data.length,
  })

  return { proposals: validated.data, model: result.model, provider: result.provider }
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
