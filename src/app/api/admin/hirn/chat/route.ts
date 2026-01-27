/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response with RAG context.
 */

import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { chat } from '@/lib/hirn'
import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiBadRequest } from '@/lib/api/helpers'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return apiUnauthorized()
    }

    // Check hirn permission
    const user = {
      email: session.user.email,
      is_staff: session.user.isStaff,
      staff_permissions: session.user.staffPermissions,
      is_super_admin: session.user.isSuperAdmin,
    }

    if (!canAccessSection(user, 'hirn')) {
      return apiForbidden('Keine Berechtigung für Hirn')
    }

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
    return apiError(error, 'Chat-Nachricht konnte nicht verarbeitet werden')
  }
}
