/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { chat } from '@/lib/hirn'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    let body: Record<string, unknown>
    try {
      body = await request.json()
    } catch {
      return apiBadRequest('Ungültiger JSON-Body')
    }
    const { message, sessionId, temperature, maxTokens } = body

    if (!message || typeof message !== 'string') {
      return apiBadRequest('Nachricht ist erforderlich')
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return apiBadRequest('Session-ID ist erforderlich')
    }

    // Validate optional numeric params at API boundary
    const parsedTemp = typeof temperature === 'number' && temperature >= 0 && temperature <= 2
      ? temperature : undefined
    const parsedMaxTokens = typeof maxTokens === 'number' && Number.isInteger(maxTokens) && maxTokens > 0 && maxTokens <= 8192
      ? maxTokens : undefined

    const response = await chat(message, {
      sessionId,
      userId: session.user.id,
      temperature: parsedTemp,
      maxTokens: parsedMaxTokens,
    })

    return apiSuccess({
      content: response.content,
      usage: response.usage,
      model: response.model,
      provider: response.provider,
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unbekannter Fehler'
    logger.error('Chat error detail', { error: detail, stack: error instanceof Error ? error.stack : undefined })
    return apiError(error, `Chat-Fehler: ${detail}`)
  }
})
