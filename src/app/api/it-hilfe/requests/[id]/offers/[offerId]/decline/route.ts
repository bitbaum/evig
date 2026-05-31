import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { eq, and, sql } from 'drizzle-orm'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { OFFER_STATUS } from '@/config/it-hilfe'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeOfferRejected } from '@/lib/email/templates/it-hilfe'
import { sendItHilfeNotification } from '@/lib/it-hilfe/notifications'
import { APP_URL } from '@/config/urls'

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>
}

/**
 * POST /api/it-hilfe/requests/[id]/offers/[offerId]/decline
 * Decline an offer (request owner only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { id, offerId } = await params

    // Validate UUID formats
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id) || !uuidRegex.test(offerId)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_ID)
    }

    // Verify request ownership
    const [requestData] = await db
      .select({
        requesterId: itHilfeRequests.requesterId,
        title: itHilfeRequests.title,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!requestData) {
      return apiNotFound('IT-Hilfe-Anfrage')
    }

    if (requestData.requesterId !== session.user.id) {
      return apiForbidden('Du kannst nur Angebote für deine eigenen Anfragen ablehnen')
    }

    // Get offer with helper info
    const [offer] = await db
      .select({
        id: itHilfeOffers.id,
        helperId: itHilfeOffers.helperId,
        status: itHilfeOffers.status,
        helperName: users.name,
        helperEmail: users.email,
      })
      .from(itHilfeOffers)
      .innerJoin(users, eq(itHilfeOffers.helperId, users.id))
      .where(and(
        eq(itHilfeOffers.id, offerId),
        eq(itHilfeOffers.requestId, id)
      ))

    if (!offer) {
      return apiNotFound('Angebot')
    }

    if (offer.status !== OFFER_STATUS.PENDING) {
      return apiBadRequest('Nur ausstehende Angebote können abgelehnt werden')
    }

    // Set offer status to rejected
    await db
      .update(itHilfeOffers)
      .set({ status: OFFER_STATUS.REJECTED })
      .where(eq(itHilfeOffers.id, offerId))

    // Decrement offer count
    await db
      .update(itHilfeRequests)
      .set({ offerCount: sql`GREATEST(${itHilfeRequests.offerCount} - 1, 0)` })
      .where(eq(itHilfeRequests.id, id))

    logger.info('Declined IT-Hilfe offer', {
      offerId,
      requestId: id,
      requesterId: session.user.id,
      helperId: offer.helperId,
    })

    // Send rejection email (fire-and-forget). sendCustomEmail resolves
    // {success:false} on SMTP failure rather than throwing; bare-catch
    // misses that mode. Same fix class.
    const requestUrl = `${APP_URL}/it-hilfe/${id}`
    sendCustomEmail(
      offer.helperEmail,
      itHilfeOfferRejected(offer.helperName || 'Techniker', requestData.title, requestUrl)
    )
      .then(r => {
        if (!r.success) {
          logger.warn('Failed to send offer declined email (resolved)', { error: r.error, helperId: offer.helperId })
        }
      })
      .catch(err => logger.warn('Failed to send offer declined email (rejected)', { error: err, helperId: offer.helperId }))

    // In-app notification for helper
    sendItHilfeNotification({
      recipientIds: [offer.helperId],
      title: 'Angebot abgelehnt',
      content: `Dein Angebot für "${requestData.title}" wurde abgelehnt.`,
      requestId: id,
    })

    return apiSuccess({
      message: 'Angebot erfolgreich abgelehnt',
    })
  } catch (error) {
    logger.error('Error declining offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
