import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query, transaction } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES, CONVERSATION_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeOfferAccepted, itHilfeOfferRejected } from '@/lib/email/templates/it-hilfe'

interface RequestRow {
  requester_id: string
  requester_name: string
  status: string
  title: string
}

interface OfferRow {
  id: string
  helper_id: string
  helper_name: string
  helper_email: string
  status: string
}

interface RejectedOfferRow {
  helper_id: string
  helper_name: string
  helper_email: string
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
      SELECT r.requester_id, r.status, r.title, u.name as requester_name
      FROM ${TABLE_NAMES.IT_HILFE_REQUESTS} r
      JOIN ${TABLE_NAMES.USERS} u ON r.requester_id = u.id
      WHERE r.id = $1
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

    // Get offer details with helper info
    const offerResult = await query(`
      SELECT o.id, o.helper_id, o.status, u.name as helper_name, u.email as helper_email
      FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
      JOIN ${TABLE_NAMES.USERS} u ON o.helper_id = u.id
      WHERE o.id = $1 AND o.request_id = $2
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

    // Send notifications (fire-and-forget, don't block the response)
    const requestUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://revampit.ch'}/it-hilfe/${id}`

    // Notify accepted helper
    sendCustomEmail(
      offerData.helper_email,
      itHilfeOfferAccepted(
        offerData.helper_name || 'Techniker',
        requestData.title,
        requestData.requester_name || 'Anfragender',
        requestUrl
      )
    ).catch(err => logger.error('Failed to send offer accepted email', { err, helperId: offerData.helper_id }))

    // Notify rejected helpers
    query(`
      SELECT o.helper_id, u.name as helper_name, u.email as helper_email
      FROM ${TABLE_NAMES.IT_HILFE_OFFERS} o
      JOIN ${TABLE_NAMES.USERS} u ON o.helper_id = u.id
      WHERE o.request_id = $1 AND o.status = 'rejected' AND o.id != $2
    `, [id, offerId]).then(result => {
      for (const row of result.rows as RejectedOfferRow[]) {
        sendCustomEmail(
          row.helper_email,
          itHilfeOfferRejected(row.helper_name || 'Techniker', requestData.title, requestUrl)
        ).catch(err => logger.error('Failed to send offer rejected email', { err, helperId: row.helper_id }))
      }
    }).catch(err => logger.error('Failed to fetch rejected offers for notification', { err }))

    return apiSuccess({
      message: 'Angebot erfolgreich akzeptiert',
    })
  } catch (error) {
    logger.error('Error accepting offer', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}
