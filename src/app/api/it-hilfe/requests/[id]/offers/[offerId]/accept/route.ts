import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, CONVERSATION_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'

interface RequestRow {
  requester_id: string
  status: string
  title: string
}

interface OfferRow {
  id: string
  helper_id: string
  status: string
}

interface RouteParams {
  params: Promise<{ id: string; offerId: string }>
}

/**
 * POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept
 * Accept an offer (request owner only)
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
      return apiBadRequest('Ungültige ID')
    }

    // Get request details and verify ownership
    const requestResult = await query(`
      SELECT requester_id, status, title FROM ${TABLE_NAMES.IT_HILFE_REQUESTS}
      WHERE id = $1
    `, [id])

    if (requestResult.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const requestData = requestResult.rows[0] as RequestRow

    if (requestData.requester_id !== session.user.id) {
      return apiForbidden('Sie können nur Angebote für Ihre eigenen Anfragen akzeptieren')
    }

    // Check if request is in a state where offers can be accepted
    if (!['open', 'in_discussion'].includes(requestData.status)) {
      return apiBadRequest('Diese Anfrage kann keine Angebote mehr akzeptieren')
    }

    // Get offer details
    const offerResult = await query(`
      SELECT id, helper_id, status FROM ${TABLE_NAMES.IT_HILFE_OFFERS}
      WHERE id = $1 AND request_id = $2
    `, [offerId, id])

    if (offerResult.rows.length === 0) {
      return apiNotFound('Angebot')
    }

    const offerData = offerResult.rows[0] as OfferRow

    if (offerData.status !== 'pending') {
      return apiBadRequest('Dieses Angebot kann nicht mehr akzeptiert werden')
    }

    // Wrap all state changes in a transaction
    await transaction(async (client) => {
      // 1. Update the accepted offer status
      await client.query(`
        UPDATE ${TABLE_NAMES.IT_HILFE_OFFERS}
        SET status = 'accepted'
        WHERE id = $1
      `, [offerId])

      // 2. Reject all other pending offers for this request
      await client.query(`
        UPDATE ${TABLE_NAMES.IT_HILFE_OFFERS}
        SET status = 'rejected'
        WHERE request_id = $1 AND id != $2 AND status = 'pending'
      `, [id, offerId])

      // 3. Update request status to matched
      await client.query(`
        UPDATE ${TABLE_NAMES.IT_HILFE_REQUESTS}
        SET status = 'matched', matched_offer_id = $1
        WHERE id = $2
      `, [offerId, id])

      // 4. Create a conversation between requester and helper
      // Ensure consistent participant ordering (required by CHECK constraint)
      const participant_1 = session.user.id < offerData.helper_id
        ? session.user.id
        : offerData.helper_id
      const participant_2 = session.user.id < offerData.helper_id
        ? offerData.helper_id
        : session.user.id

      // Check if conversation already exists
      const existingConv = await client.query(`
        SELECT id FROM ${TABLE_NAMES.CONVERSATIONS}
        WHERE participant_1 = $1 AND participant_2 = $2
          AND type = $3 AND context_id = $4
      `, [participant_1, participant_2, CONVERSATION_TYPES.IT_HILFE, id])

      if (existingConv.rows.length === 0) {
        await client.query(`
          INSERT INTO ${TABLE_NAMES.CONVERSATIONS} (
            participant_1,
            participant_2,
            type,
            context_id,
            title
          ) VALUES (
            $1, $2, $3, $4, $5
          )
        `, [
          participant_1,
          participant_2,
          CONVERSATION_TYPES.IT_HILFE,
          id,
          `IT-Hilfe: ${requestData.title}`,
        ])
      }
    })

    logger.info('Accepted peer repair offer', {
      requestId: id,
      offerId,
      requesterId: session.user.id,
      helperId: offerData.helper_id,
    })

    return apiSuccess({
      message: 'Angebot erfolgreich akzeptiert',
    })
  } catch (error) {
    logger.error('Error accepting offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
