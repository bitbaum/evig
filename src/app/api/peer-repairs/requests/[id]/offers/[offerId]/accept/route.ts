import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
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
 * POST /api/peer-repairs/requests/[id]/offers/[offerId]/accept
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
      SELECT requester_id, status, title FROM ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
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
      SELECT id, helper_id, status FROM ${TABLE_NAMES.PEER_REPAIR_OFFERS}
      WHERE id = $1 AND request_id = $2
    `, [offerId, id])

    if (offerResult.rows.length === 0) {
      return apiNotFound('Angebot')
    }

    const offerData = offerResult.rows[0] as OfferRow

    if (offerData.status !== 'pending') {
      return apiBadRequest('Dieses Angebot kann nicht mehr akzeptiert werden')
    }

    // Start transaction-like operations
    // 1. Update the accepted offer status
    await query(`
      UPDATE ${TABLE_NAMES.PEER_REPAIR_OFFERS}
      SET status = 'accepted'
      WHERE id = $1
    `, [offerId])

    // 2. Reject all other pending offers for this request
    await query(`
      UPDATE ${TABLE_NAMES.PEER_REPAIR_OFFERS}
      SET status = 'rejected'
      WHERE request_id = $1 AND id != $2 AND status = 'pending'
    `, [id, offerId])

    // 3. Update request status to matched
    await query(`
      UPDATE ${TABLE_NAMES.PEER_REPAIR_REQUESTS}
      SET status = 'matched', matched_offer_id = $1
      WHERE id = $2
    `, [offerId, id])

    // 4. Create a conversation between requester and helper
    try {
      // Check if conversation already exists
      const existingConv = await query(`
        SELECT id FROM ${TABLE_NAMES.CONVERSATIONS}
        WHERE context_type = $1 AND context_id = $2
      `, [CONVERSATION_TYPES.PEER_REPAIR, id])

      let conversationId: string

      if (existingConv.rows.length > 0) {
        conversationId = (existingConv.rows[0] as { id: string }).id
      } else {
        // Create new conversation
        const convResult = await query(`
          INSERT INTO ${TABLE_NAMES.CONVERSATIONS} (
            context_type,
            context_id,
            title,
            participants
          ) VALUES (
            $1, $2, $3, $4
          )
          RETURNING id
        `, [
          CONVERSATION_TYPES.PEER_REPAIR,
          id,
          `Reparatur: ${requestData.title}`,
          [session.user.id, offerData.helper_id],
        ])
        conversationId = (convResult.rows[0] as { id: string }).id
      }

      logger.info('Created conversation for peer repair', {
        conversationId,
        requestId: id,
        participants: [session.user.id, offerData.helper_id],
      })
    } catch (convError) {
      // Log but don't fail the request if conversation creation fails
      logger.error('Failed to create conversation for peer repair', {
        error: convError,
        requestId: id,
      })
    }

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
