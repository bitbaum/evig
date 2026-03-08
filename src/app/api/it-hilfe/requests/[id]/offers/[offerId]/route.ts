import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import { OFFER_STATUS } from '@/config/it-hilfe'

interface OfferRow {
  helper_id: string
  status: string
  request_id: string
}

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
    const offerResult = await query(`
      SELECT helper_id, status, request_id
      FROM ${TABLE_NAMES.IT_HILFE_OFFERS}
      WHERE id = $1 AND request_id = $2
    `, [offerId, id])

    if (offerResult.rows.length === 0) {
      return apiNotFound('Angebot')
    }

    const offer = offerResult.rows[0] as OfferRow

    if (offer.helper_id !== session.user.id) {
      return apiForbidden('Sie können nur Ihre eigenen Angebote zurückziehen')
    }

    if (offer.status !== OFFER_STATUS.PENDING) {
      return apiBadRequest('Nur ausstehende Angebote können zurückgezogen werden')
    }

    // Update offer status to withdrawn
    await query(`
      UPDATE ${TABLE_NAMES.IT_HILFE_OFFERS}
      SET status = '${OFFER_STATUS.WITHDRAWN}'
      WHERE id = $1
    `, [offerId])

    // Decrement offer count on request
    await query(`
      UPDATE ${TABLE_NAMES.IT_HILFE_REQUESTS}
      SET offer_count = GREATEST(offer_count - 1, 0)
      WHERE id = $1
    `, [id])

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
