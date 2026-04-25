/**
 * Vote Advisor API
 *
 * POST /api/ai/vote-advisor
 *
 * Provides AI consultation for voters: explains what a decision means,
 * what the implications of each option are, and how the voting method works.
 *
 * No auth required — public voters (via /vote/[id]) need this too.
 * The decision context is passed in the request body (already loaded by the caller).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { callWithFallback } from '@/lib/ai/providers'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import {
  VOTING_ADVISOR_PROMPTS,
  VOTING_METHOD_LABELS,
  VOTING_METHOD_EXPLANATIONS,
} from '@/lib/ai/config/prompts'

const requestSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(3000),
  background: z.string().max(3000).optional(),
  votingMethod: z.string(),
  options: z.array(z.object({
    label: z.string(),
    description: z.string().optional(),
  })).optional(),
  question: z.string().min(1).max(500),
})

export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiBadRequest('Ungültiger JSON-Body')
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest('Ungültige Anfrage', parsed.error.flatten().fieldErrors)
    }

    const { title, description, background, votingMethod, options, question } = parsed.data

    // Build options string for prompt
    const optionsText = options && options.length > 0
      ? options.map((o, i) => `${i + 1}. ${o.label}${o.description ? ': ' + o.description : ''}`).join('\n')
      : '(Keine vordefinierten Optionen — Ja/Nein oder offene Abstimmung)'

    // Fill the prompt template
    const userPrompt = VOTING_ADVISOR_PROMPTS.advise
      .replace('{title}', title)
      .replace('{description}', description)
      .replace('{background}', background || '(Kein weiterer Hintergrund angegeben)')
      .replace('{votingMethod}', VOTING_METHOD_LABELS[votingMethod] || votingMethod)
      .replace('{votingMethodExplanation}', VOTING_METHOD_EXPLANATIONS[votingMethod] || votingMethod)
      .replace('{options}', optionsText)
      .replace('{question}', question)

    logger.info('Vote advisor requested', {
      votingMethod,
      optionCount: options?.length ?? 0,
      questionLength: question.length,
    })

    const ADVISOR_TIMEOUT_MS = 30_000
    const result = await Promise.race([
      callWithFallback({
        systemPrompt: VOTING_ADVISOR_PROMPTS.system,
        userPrompt,
        maxTokens: 512,
        temperature: 0.3,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung')), ADVISOR_TIMEOUT_MS)
      ),
    ])

    if (!result) {
      // Custom 503 — AI fallback chain exhausted
      return NextResponse.json(
        { success: false, error: 'KI-Dienst vorübergehend nicht verfügbar. Bitte versuche es später erneut.' },
        { status: 503 }
      )
    }

    return apiSuccess({ analysis: result.text, model: result.model })
  } catch (error) {
    return apiError(error, 'Fehler beim Erstellen der Analyse')
  }
}
