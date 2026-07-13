/**
 * Ask Hirn about a shared deliverable (public / no login).
 * POST /api/public/share/[token]/ask  { message, history? } → { reply }
 *
 * Under /api/public/* so CSRF is not enforced. Grounded strictly in the
 * deliverable's own files, so an unauthenticated viewer gets
 * answers about the code without any access to internal Hirn knowledge.
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiSuccess, apiError, apiNotFound, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { rateLimiters } from '@/lib/security/rate-limit'
import { askDeliverableSchema } from '@/lib/schemas/deliverables'
import { getDeliverableByToken } from '@/lib/services/deliverables'
import { answerDeliverableQuestion } from '@/lib/deliverables/ai'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ token: string }> }

export async function POST(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { token } = await params
    // Rate-limit per share token — a public LLM endpoint must be bounded.
    if (!rateLimiters.hirnChatUser(`share:${token}:ask`)) {
      return apiRateLimited('Zu viele Anfragen. Bitte warte eine Weile.')
    }

    const deliverable = await getDeliverableByToken(token)
    if (!deliverable) return apiNotFound('Freigabe')

    const body = await request.json()
    const result = askDeliverableSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const reply = await answerDeliverableQuestion(deliverable, result.data.message, result.data.history)
    return apiSuccess({ reply })
  } catch (error) {
    logger.error('Public deliverable ask error', { error })
    return apiError(error, 'Hirn ist gerade nicht erreichbar. Bitte versuche es später erneut.')
  }
}
