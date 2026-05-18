/**
 * Protocol Advisor API
 *
 * POST /api/ai/protocol-advisor
 *
 * Provides AI consultation about a meeting protocol: helps staff understand
 * decisions, tasks, context, and key outcomes from the structured notes.
 *
 * Auth required — staff only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { logger } from '@/lib/logger'
import { callWithFallback } from '@/lib/ai/providers'
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

const requestSchema = z.object({
  title: z.string().min(1).max(300),
  summary: z.string().max(2000).optional(),
  topics: z.array(z.object({
    title: z.string(),
    discussion: z.string(),
    outcome: z.string().nullable().optional(),
  })).optional(),
  actionItems: z.array(z.object({
    description: z.string(),
    assigned_to_name: z.string().nullable().optional(),
    item_type: z.string(),
  })).optional(),
  question: z.string().min(1).max(500),
})

const SYSTEM_PROMPT = `Du bist ein hilfreicher Assistent für RevampIT-Sitzungsprotokolle.
Du hilfst Teammitgliedern, Protokolle besser zu verstehen und offene Fragen zu klären.

Regeln:
- Antworte präzise und hilfreich auf Deutsch (Schweizer Schreibweise, ss statt ß)
- Bleibe beim Inhalt des konkreten Protokolls
- Wenn eine Frage über den Protokollinhalt hinausgeht, weise darauf hin
- Halte Antworten unter 200 Wörtern — knapp und klar
- Keine Empfehlungen, die über den Protokollinhalt hinausgehen`

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) return apiUnauthorized()

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return apiBadRequest('Ungültiger JSON-Body')
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST, parsed.error.flatten().fieldErrors)
    }

    const { title, summary, topics, actionItems, question } = parsed.data

    const topicsText = topics && topics.length > 0
      ? topics.map((t, i) =>
          `${i + 1}. ${t.title}: ${t.discussion}${t.outcome ? ` → Ergebnis: ${t.outcome}` : ''}`
        ).join('\n')
      : '(Keine Themen strukturiert)'

    const actionsText = actionItems && actionItems.length > 0
      ? actionItems.map(a =>
          `- [${a.item_type}] ${a.description}${a.assigned_to_name ? ` (zuständig: ${a.assigned_to_name})` : ''}`
        ).join('\n')
      : '(Keine Aktionen erkannt)'

    const userPrompt = `PROTOKOLL: ${title}

ZUSAMMENFASSUNG:
${summary || '(Keine Zusammenfassung verfügbar)'}

THEMEN:
${topicsText}

AKTIONEN / ENTSCHEIDUNGEN:
${actionsText}

FRAGE:
${question}

Beantworte die Frage basierend auf dem Protokollinhalt. Knapp und klar, unter 200 Wörtern.`

    logger.info('Protocol advisor requested', { questionLength: question.length })

    const result = await Promise.race([
      callWithFallback({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt,
        maxTokens: 400,
        temperature: 0.3,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Zeitüberschreitung')), 30_000)
      ),
    ])

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'KI-Dienst vorübergehend nicht verfügbar. Bitte versuche es später erneut.' },
        { status: 503 }
      )
    }

    return apiSuccess({ analysis: result.text })
  } catch (error) {
    return apiError(error, 'Fehler beim Erstellen der Analyse')
  }
}
