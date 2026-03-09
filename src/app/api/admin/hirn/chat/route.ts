/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { chat } from '@/lib/hirn'
import { apiSuccess, apiError } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { validateBody, HirnChatSchema } from '@/lib/schemas'

export const POST = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const validation = validateBody(HirnChatSchema, body)
    if (!validation.success) return validation.error
    const { message, sessionId, temperature, maxTokens } = validation.data

    const response = await chat(message, {
      sessionId,
      userId: session.user.id,
      temperature,
      maxTokens,
    })

    return apiSuccess({
      content: response.content,
      actions: response.actions || [],
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
