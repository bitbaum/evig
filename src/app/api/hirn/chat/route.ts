/**
 * API: Hirn Public Chat
 *
 * POST /api/hirn/chat
 * Page-aware assistant chat for logged-in users on the public site.
 *
 * ISOLATION (deliberate — do not "unify" with the admin route):
 *   - no RAG retrieval (hirn_documents hold internal finance/personnel data)
 *   - no action cockpit (actions are staff-only)
 *   - public-safe system prompt (buildPublicSystemPrompt)
 * Only the provider layer is shared with /api/admin/hirn/chat (SSOT).
 *
 * History is client-held (capped), not persisted server-side.
 */

import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { getDefaultChatProvider, type Message } from '@/lib/hirn/providers'
import { buildPublicSystemPrompt } from '@/lib/hirn/public-prompt'
import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/helpers'
import { rateLimiters } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { validateBody, PublicHirnChatSchema } from '@/lib/schemas'

/** Keep only the most recent turns — the context chip re-anchors each call. */
const HISTORY_LIMIT = 10

export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    if (!rateLimiters.hirnChatUser(`${session.user.id}:hirn-chat-user`)) {
      return apiRateLimited('Zu viele Anfragen an Hirn. Bitte warte eine Stunde.')
    }

    const body = await request.json()
    const validation = validateBody(PublicHirnChatSchema, body)
    if (!validation.success) return validation.error
    const { message, pathname, history } = validation.data

    const context = resolveHirnContext(pathname, 'public')

    const messages: Message[] = [
      { role: 'system', content: buildPublicSystemPrompt(context) },
      ...(history ?? []).slice(-HISTORY_LIMIT),
      { role: 'user', content: message },
    ]

    // Same provider layer as the admin route (system default — public users
    // have no per-user provider settings).
    const provider = await getDefaultChatProvider()
    const response = await provider.chat({
      messages,
      temperature: 0.7,
      maxTokens: 1024,
    })

    logger.info('Public Hirn chat response generated', {
      userId: session.user.id,
      area: context.area,
      provider: response.provider,
      model: response.model,
    })

    return apiSuccess({ reply: response.content })
  } catch (error) {
    logger.error('Public Hirn chat error', {
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    })
    return apiError(error, 'Hirn ist gerade nicht erreichbar. Bitte versuche es später erneut.')
  }
})
