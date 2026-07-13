/**
 * Ask Hirn about a deliverable (admin / logged-in).
 * POST /api/deliverables/[id]/ask  { message, history? } → { reply }
 */

import { NextRequest } from 'next/server'
import { withAdmin, type ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiNotFound, apiBadRequest, apiRateLimited } from '@/lib/api/helpers'
import { rateLimiters } from '@/lib/security/rate-limit'
import { askDeliverableSchema } from '@/lib/schemas/deliverables'
import { getDeliverable } from '@/lib/services/deliverables'
import { answerDeliverableQuestion } from '@/lib/deliverables/ai'
import { logger } from '@/lib/logger'

type RouteParams = { id: string }

export const POST = withAdmin<RouteParams>('deliverables', async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    if (!rateLimiters.hirnChatUser(`${session.user.id}:deliverable-ask`)) {
      return apiRateLimited('Zu viele Anfragen an Hirn. Bitte warte eine Stunde.')
    }
    const id = context?.params?.id
    if (!id) return apiBadRequest('ID erforderlich')

    const body = await request.json()
    const result = askDeliverableSchema.safeParse(body)
    if (!result.success) {
      return apiBadRequest('Validierung fehlgeschlagen', result.error.flatten().fieldErrors)
    }

    const deliverable = await getDeliverable(id)
    if (!deliverable) return apiNotFound('Liefergegenstand')

    const reply = await answerDeliverableQuestion(deliverable, result.data.message, result.data.history)
    return apiSuccess({ reply })
  } catch (error) {
    logger.error('Deliverable ask error', { error, userId: session.user.id })
    return apiError(error, 'Hirn ist gerade nicht erreichbar. Bitte versuche es später erneut.')
  }
})
