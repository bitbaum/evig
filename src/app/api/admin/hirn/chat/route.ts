/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response with RAG context.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { chat } from '@/lib/hirn'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'

export const POST = withAdmin(async (request: NextRequest, session) => {
  try {
    const body = await request.json()
    const { message, sessionId, temperature, maxTokens, topK, minSimilarity } = body

    if (!message || typeof message !== 'string') {
      return apiBadRequest('Nachricht ist erforderlich')
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return apiBadRequest('Session-ID ist erforderlich')
    }

    const response = await chat(message, {
      sessionId,
      userId: session.user.id,
      temperature,
      maxTokens,
      topK,
      minSimilarity,
    })

    return apiSuccess({
      content: response.content,
      contextUsed: response.contextUsed.map(c => ({
        chunkId: c.chunkId,
        content: c.content.slice(0, 200) + (c.content.length > 200 ? '...' : ''),
        similarity: c.similarity,
        source: c.document.title || c.document.sourcePath,
      })),
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
