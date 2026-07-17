/**
 * API: Hirn Chat
 *
 * POST /api/admin/hirn/chat
 * Send a message and get an AI response.
 */

import { NextRequest } from 'next/server'
import { withAdmin } from '@/lib/api/middleware'
import { chat } from '@/lib/hirn'
import { buildSystemPrompt } from '@/lib/hirn/system-prompt'
import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { apiSuccess, apiError, apiRateLimited } from '@/lib/api/helpers'
import { rateLimiters } from '@/lib/security/rate-limit'
import { logger } from '@/lib/logger'
import { validateBody, HirnChatSchema } from '@/lib/schemas'

export const POST = withAdmin('hirn', async (request: NextRequest, session) => {
  try {
    if (!rateLimiters.hirnChatStaff(`${session.user.id}:hirn-chat-staff`)) {
      return apiRateLimited('Zu viele Anfragen an Hirn. Bitte warte einen Moment.')
    }

    const body = await request.json()
    const validation = validateBody(HirnChatSchema, body)
    if (!validation.success) return validation.error
    const { message, sessionId, temperature, maxTokens, pathname } = validation.data

    // Enrich the system prompt with what the user is currently looking at —
    // description + the page's real deep links (so answers link correctly).
    let pageContext: string | undefined
    if (pathname) {
      const ctx = resolveHirnContext(pathname, 'admin')
      const links = ctx.quickActions?.map(a => `${a.label}: ${a.href}`).join(' · ')
      pageContext = [ctx.description, links ? `Direkt relevante Seiten: ${links}` : '']
        .filter(Boolean)
        .join('\n')
    }

    // UI language — written by the LocaleSwitcher; admin routes carry no URL locale.
    const uiLocale = request.cookies.get('NEXT_LOCALE')?.value

    const response = await chat(message, {
      sessionId,
      userId: session.user.id,
      temperature,
      maxTokens,
      systemPrompt: buildSystemPrompt(pageContext, uiLocale),
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
