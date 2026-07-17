/**
 * Task Advisor API
 *
 * POST /api/ai/task-advisor
 *
 * "Ask the AI for help" on a task: unlike the protocol advisor (which stays
 * strictly within the document), this one gives PRACTICAL help — how to
 * approach the task, break it into steps, spot blockers, draft messages.
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
  description: z.string().max(4000).nullable().optional(),
  instructions: z.string().max(4000).nullable().optional(),
  status: z.string().max(50).optional(),
  priority: z.string().max(50).optional(),
  dueDate: z.string().max(50).nullable().optional(),
  protocolTitle: z.string().max(300).nullable().optional(),
  question: z.string().min(1).max(500),
})

const SYSTEM_PROMPT = `Du bist ein praktischer Assistent für Aufgaben bei RevampIT
(Schweizer Non-Profit: gebrauchte Computer reparieren und weitergeben).
Du hilfst Teammitgliedern, ihre Aufgaben tatsächlich zu erledigen.

Regeln:
- Antworte praktisch und konkret auf Deutsch (Schweizer Schreibweise, ss statt ß)
- Gib umsetzbare Schritte, keine Allgemeinplätze
- Wenn dir Kontext fehlt, sage was du wissen müsstest — erfinde nichts
- Halte Antworten unter 250 Wörtern — knapp und klar`

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

    const { title, description, instructions, status, priority, dueDate, protocolTitle, question } = parsed.data

    const userPrompt = `AUFGABE: ${title}

BESCHREIBUNG:
${description || '(Keine Beschreibung)'}
${instructions ? `\nANLEITUNG:\n${instructions}` : ''}
STATUS: ${status || 'unbekannt'} · PRIORITÄT: ${priority || 'normal'}${dueDate ? ` · FÄLLIG: ${dueDate}` : ''}${protocolTitle ? `\nSTAMMT AUS PROTOKOLL: ${protocolTitle}` : ''}

FRAGE:
${question}

Hilf konkret weiter. Knapp und klar, unter 250 Wörtern.`

    logger.info('Task advisor requested', { questionLength: question.length })

    const result = await callWithFallback({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      maxTokens: 500,
      temperature: 0.3,
      timeoutMs: 10_000,
    })

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
