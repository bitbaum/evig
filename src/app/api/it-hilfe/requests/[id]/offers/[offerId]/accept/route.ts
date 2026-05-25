import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { acceptOffer } from '@/lib/it-hilfe/accept-offer'

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>
}

/**
 * POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept
 * Accept an offer (request owner only — authenticated session).
 *
 * The state-change semantics live in @/lib/it-hilfe/accept-offer; this
 * route is just the session-authenticated transport. A second route (in
 * a follow-up commit) reuses the same helper for token-driven one-tap
 * acceptance via email.
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id, offerId } = await params

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) || !uuidRegex.test(offerId)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_ID)
    }

    const result = await acceptOffer({
      requestId: id,
      offerId,
      acceptingUserId: session.user.id,
    })

    if (!result.ok) {
      switch (result.reason) {
        case 'request_not_found':
          return apiNotFound('Reparaturanfrage')
        case 'offer_not_found':
          return apiNotFound('Angebot')
        case 'not_authorized':
          return apiForbidden('Du kannst nur Angebote für deine eigenen Anfragen akzeptieren')
        case 'request_not_open':
          return apiBadRequest('Diese Anfrage kann keine Angebote mehr akzeptieren')
        case 'offer_not_pending':
          return apiBadRequest('Dieses Angebot kann nicht mehr akzeptiert werden')
      }
    }

    return apiSuccess({ message: 'Angebot erfolgreich akzeptiert' })
  } catch (error) {
    logger.error('Error accepting offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
