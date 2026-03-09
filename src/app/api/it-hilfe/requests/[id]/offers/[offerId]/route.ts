import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { OFFER_STATUS } from '@/config/it-hilfe'

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>
}

/**
 * DELETE /api/it-hilfe/requests/[id]/offers/[offerId]
 * Withdraw a pending offer (offer owner only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id, offerId } = await params

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) || !uuidRegex.test(offerId)) {
      return apiBadRequest('Ungültige ID')
    }

    // Get offer and verify ownership
    const [offer] = await db
      .select({
        helperId: itHilfeOffers.helperId,
        status: itHilfeOffers.status,
        requestId: itHilfeOffers.requestId,
      })
      .from(itHilfeOffers)
      .where(and(
        eq(itHilfeOffers.id, offerId),
        eq(itHilfeOffers.requestId, id)
      ))

    if (!offer) {
      return apiNotFound('Angebot')
    }

    if (offer.helperId !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Angebote zurückziehen')
    }

    if (offer.status !== OFFER_STATUS.PENDING) {
      return apiBadRequest('Nur ausstehende Angebote können zurückgezogen werden')
    }

    // Update offer status to withdrawn
    await db
      .update(itHilfeOffers)
      .set({ status: OFFER_STATUS.WITHDRAWN })
      .where(eq(itHilfeOffers.id, offerId))

    // Decrement offer count on request
    await db
      .update(itHilfeRequests)
      .set({ offerCount: sql`GREATEST(${itHilfeRequests.offerCount} - 1, 0)` })
      .where(eq(itHilfeRequests.id, id))

    logger.info('Withdrew IT-Hilfe offer', {
      offerId,
      requestId: id,
      helperId: session.user.id,
    })

    return apiSuccess({
      message: 'Angebot erfolgreich zurückgezogen',
    })
  } catch (error) {
    logger.error('Error withdrawing offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
