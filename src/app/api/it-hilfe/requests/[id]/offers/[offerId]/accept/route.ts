import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { sql, eq, and, ne, getTableName } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers } from '@/db/schema/itHilfe'
import { users } from '@/db/schema/auth'
import { conversations } from '@/db/schema/messaging'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest, apiNotFound, apiForbidden } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { CONVERSATION_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeOfferAccepted, itHilfeOfferRejected } from '@/lib/email/templates/it-hilfe'
import { REQUEST_STATUS, OFFER_STATUS } from '@/config/it-hilfe'

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

// Table name refs
const reqTable = getTableName(itHilfeRequests)
const offTable = getTableName(itHilfeOffers)
const uTable = getTableName(users)
const convTable = getTableName(conversations)

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
    const requestResult = await db.execute(sql`
      SELECT r.requester_id, r.status, r.title, u.name as requester_name
      FROM ${sql.raw(reqTable)} r
      JOIN ${sql.raw(uTable)} u ON r.requester_id = u.id
      WHERE r.id = ${id}
    `)

    if (requestResult.rows.length === 0) {
      return apiNotFound('Reparaturanfrage')
    }

    const requestData = requestResult.rows[0] as unknown as RequestRow

    if (requestData.requester_id !== session.user.id) {
      return apiForbidden('Sie können nur Angebote für Ihre eigenen Anfragen akzeptieren')
    }

    // Check if request is in a state where offers can be accepted
    if (requestData.status !== REQUEST_STATUS.OPEN && requestData.status !== REQUEST_STATUS.IN_DISCUSSION) {
      return apiBadRequest('Diese Anfrage kann keine Angebote mehr akzeptieren')
    }

    // Get offer details with helper info
    const offerResult = await db.execute(sql`
      SELECT o.id, o.helper_id, o.status, u.name as helper_name, u.email as helper_email
      FROM ${sql.raw(offTable)} o
      JOIN ${sql.raw(uTable)} u ON o.helper_id = u.id
      WHERE o.id = ${offerId} AND o.request_id = ${id}
    `)

    if (offerResult.rows.length === 0) {
      return apiNotFound('Angebot')
    }

    const offerData = offerResult.rows[0] as unknown as OfferRow

    if (offerData.status !== OFFER_STATUS.PENDING) {
      return apiBadRequest('Dieses Angebot kann nicht mehr akzeptiert werden')
    }

    // Wrap all state changes in a transaction
    await db.transaction(async (tx) => {
      // 1. Update the accepted offer status
      await tx.update(itHilfeOffers)
        .set({ status: OFFER_STATUS.ACCEPTED })
        .where(eq(itHilfeOffers.id, offerId))

      // 2. Reject all other pending offers for this request
      await tx.update(itHilfeOffers)
        .set({ status: OFFER_STATUS.REJECTED })
        .where(
          and(
            eq(itHilfeOffers.requestId, id),
            ne(itHilfeOffers.id, offerId),
            eq(itHilfeOffers.status, OFFER_STATUS.PENDING)
          )
        )

      // 3. Update request status to matched
      await tx.update(itHilfeRequests)
        .set({ status: REQUEST_STATUS.MATCHED, matchedOfferId: offerId })
        .where(eq(itHilfeRequests.id, id))

      // 4. Create a conversation between requester and helper
      // Ensure consistent participant ordering (required by CHECK constraint)
      const participant_1 = session.user.id < offerData.helper_id
        ? session.user.id
        : offerData.helper_id
      const participant_2 = session.user.id < offerData.helper_id
        ? offerData.helper_id
        : session.user.id

      // Check if conversation already exists
      const existingConv = await tx.execute(sql`
        SELECT id FROM ${sql.raw(convTable)}
        WHERE participant_1 = ${participant_1} AND participant_2 = ${participant_2}
          AND type = ${CONVERSATION_TYPES.IT_HILFE} AND context_id = ${id}
      `)

      if (existingConv.rows.length === 0) {
        await tx.insert(conversations).values({
          participant1: participant_1,
          participant2: participant_2,
          type: CONVERSATION_TYPES.IT_HILFE,
          contextId: id,
          title: `IT-Hilfe: ${requestData.title}`,
        })
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
    db.execute(sql`
      SELECT o.helper_id, u.name as helper_name, u.email as helper_email
      FROM ${sql.raw(offTable)} o
      JOIN ${sql.raw(uTable)} u ON o.helper_id = u.id
      WHERE o.request_id = ${id} AND o.status = ${OFFER_STATUS.REJECTED} AND o.id != ${offerId}
    `).then(result => {
      for (const row of result.rows as unknown as RejectedOfferRow[]) {
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
