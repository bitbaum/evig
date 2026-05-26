import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { itHilfeOffers, itHilfeRequests } from '@/db/schema'
import { eq, and, sql, getTableName } from 'drizzle-orm'

const offTable = getTableName(itHilfeOffers)
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
      return apiBadRequest(ERROR_MESSAGES.INVALID_ID)
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
      return apiForbidden('Du kannst nur deine eigenen Angebote zurückziehen')
    }

    if (offer.status !== OFFER_STATUS.PENDING) {
      return apiBadRequest('Nur ausstehende Angebote können zurückgezogen werden')
    }

    // Update offer to WITHDRAWN + decrement request.offerCount.
    //
    // Race: helper double-clicks "Withdraw". Both pre-reads (line 35-57)
    // pass status === PENDING. Without a lock both UPDATEs fire — the
    // status set is idempotent but the offerCount decrement double-fires,
    // drifting the count down in the "X Angebote erhalten" UI. Lock the
    // offer row with FOR UPDATE inside a transaction, re-verify
    // status === PENDING, and gate the offerCount decrement on the
    // re-check. Race-loser sees status='withdrawn' and aborts without
    // re-decrementing — same shape as 90bdbabf / cc89b7f6 / f7b652b7 /
    // 7ab2c52e, extending the TOCTOU pattern to the offer-withdraw
    // state transition.
    const transitioned = await db.transaction(async (tx) => {
      const lockedOff = await tx.execute(sql`
        SELECT status FROM ${sql.raw(offTable)}
        WHERE id = ${offerId}
        FOR UPDATE
      `)
      const lockedStatus = (lockedOff.rows[0] as { status?: string } | undefined)?.status
      if (lockedStatus !== OFFER_STATUS.PENDING) return false

      await tx
        .update(itHilfeOffers)
        .set({ status: OFFER_STATUS.WITHDRAWN })
        .where(eq(itHilfeOffers.id, offerId))

      await tx
        .update(itHilfeRequests)
        .set({ offerCount: sql`GREATEST(${itHilfeRequests.offerCount} - 1, 0)` })
        .where(eq(itHilfeRequests.id, id))

      return true
    })

    if (!transitioned) {
      // Idempotent: offer was already withdrawn (race-loser of a double
      // click). Return success so the UI doesn't show an error for the
      // already-achieved end-state.
      return apiSuccess({
        message: 'Angebot erfolgreich zurückgezogen',
      })
    }

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
