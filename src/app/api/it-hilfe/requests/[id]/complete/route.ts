import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, sql, getTableName } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers, users, repairerProfiles } from '@/db/schema'

const reqTable = getTableName(itHilfeRequests)
import { withAuth, type ValidSession } from '@/lib/api/middleware'
import {
  apiError,
  apiSuccess,
  apiBadRequest,
  apiNotFound,
  apiForbidden,
} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, OFFER_STATUS } from '@/config/it-hilfe'
import { notifyRequestCompleted } from '@/lib/it-hilfe/notifications'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * POST /api/it-hilfe/requests/[id]/complete
 *
 * Helper marks an IT-Hilfe request as completed. Caller must own the
 * accepted offer on this request. Sets status to 'completed' and notifies
 * the requester to confirm and leave a review.
 */
export const POST = withAuth<{ id: string }>(async (
  _request: NextRequest,
  session: ValidSession,
  context,
): Promise<NextResponse> => {
  try {
    const id = context?.params?.id
    if (!id || !UUID_REGEX.test(id)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST_ID)
    }

    const [row] = await db
      .select({
        requestId: itHilfeRequests.id,
        requesterId: itHilfeRequests.requesterId,
        requesterName: users.name,
        requesterEmail: users.email,
        title: itHilfeRequests.title,
        status: itHilfeRequests.status,
        matchedOfferId: itHilfeRequests.matchedOfferId,
      })
      .from(itHilfeRequests)
      .innerJoin(users, eq(itHilfeRequests.requesterId, users.id))
      .where(eq(itHilfeRequests.id, id))

    if (!row) return apiNotFound('IT-Hilfe-Anfrage')

    if (row.status !== REQUEST_STATUS.MATCHED) {
      return apiBadRequest(
        'Die Anfrage kann nur abgeschlossen werden, wenn sie vergeben ist',
      )
    }

    if (!row.matchedOfferId) {
      return apiBadRequest('Kein akzeptiertes Angebot gefunden')
    }

    // Verify caller is the accepted helper
    const [offer] = await db
      .select({
        id: itHilfeOffers.id,
        helperId: itHilfeOffers.helperId,
        status: itHilfeOffers.status,
      })
      .from(itHilfeOffers)
      .where(eq(itHilfeOffers.id, row.matchedOfferId))

    if (!offer || offer.status !== OFFER_STATUS.ACCEPTED) {
      return apiBadRequest('Kein gültiges akzeptiertes Angebot')
    }

    if (offer.helperId !== session.user.id) {
      return apiForbidden(
        'Nur der zugewiesene Helfer kann die Anfrage als abgeschlossen markieren',
      )
    }

    // Mark request as completed + bump helper totals (transactional).
    //
    // Race: helper double-clicks "Mark complete". Both reads pass (request
    // MATCHED, offer ACCEPTED, helperId matches). Without a lock both
    // transactions run — the status UPDATE is idempotent but the
    // totalJobsCompleted increment double-fires, inflating the helper's
    // job count by 1 per duplicate click. Lock the request row with
    // FOR UPDATE inside the transaction and re-verify status === MATCHED;
    // a race-loser sees status === 'completed' and aborts cleanly without
    // re-incrementing. Same shape as 90bdbabf / cc89b7f6.
    const raceWon = await db.transaction(async (tx) => {
      const lockedReq = await tx.execute(sql`
        SELECT status FROM ${sql.raw(reqTable)}
        WHERE id = ${id}
        FOR UPDATE
      `)
      const lockedStatus = (lockedReq.rows[0] as { status?: string } | undefined)?.status
      if (lockedStatus !== REQUEST_STATUS.MATCHED) return false

      await tx
        .update(itHilfeRequests)
        .set({
          status: REQUEST_STATUS.COMPLETED,
          completedAt: sql`NOW()`,
          completedBy: session.user.id,
        })
        .where(eq(itHilfeRequests.id, id))

      await tx
        .update(repairerProfiles)
        .set({ totalJobsCompleted: sql`${repairerProfiles.totalJobsCompleted} + 1` })
        .where(eq(repairerProfiles.userId, session.user.id))
      return true
    })

    if (!raceWon) {
      // Idempotent: the request is already completed (likely by a sibling
      // double-click). Return success so the UI doesn't show an error for
      // what is essentially the desired end-state.
      return apiSuccess({ message: 'Anfrage als abgeschlossen markiert' })
    }

    logger.info('IT-Hilfe request marked completed by helper', {
      requestId: id,
      helperId: session.user.id,
    })

    notifyRequestCompleted({
      recipientIds: [row.requesterId],
      requestId: id,
      requesterName: row.requesterName || 'Anfragender',
      requestTitle: row.title,
    })

    return apiSuccess({ message: 'Anfrage als abgeschlossen markiert' })
  } catch (error) {
    logger.error('Error completing IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
