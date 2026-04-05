import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, sql } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers, users, helperProfiles } from '@/db/schema'
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
import { sendCustomEmail } from '@/lib/email'
import { itHilfeCompleted } from '@/lib/email/templates/it-hilfe'
import { sendItHilfeNotification } from '@/lib/it-hilfe/notifications'
import { APP_URL } from '@/config/urls'

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
      return apiBadRequest('Ungültige Anfrage-ID')
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

    // Mark request as completed + bump helper totals (transactional)
    await db.transaction(async (tx) => {
      await tx
        .update(itHilfeRequests)
        .set({
          status: REQUEST_STATUS.COMPLETED,
          completedAt: sql`NOW()`,
          completedBy: session.user.id,
        })
        .where(eq(itHilfeRequests.id, id))

      await tx
        .update(helperProfiles)
        .set({ totalHelpsCompleted: sql`${helperProfiles.totalHelpsCompleted} + 1` })
        .where(eq(helperProfiles.userId, session.user.id))
    })

    logger.info('IT-Hilfe request marked completed by helper', {
      requestId: id,
      helperId: session.user.id,
    })

    // Notify requester (in-app + email, fire-and-forget)
    sendItHilfeNotification({
      recipientIds: [row.requesterId],
      title: 'Hilfe abgeschlossen - bitte bestätigen',
      content:
        'Die Hilfe wurde als abgeschlossen markiert. Bitte bestätigen Sie und geben Sie eine Bewertung ab.',
      requestId: id,
    })

    const requestUrl = `${APP_URL}/it-hilfe/${id}`
    sendCustomEmail(
      row.requesterEmail,
      itHilfeCompleted(row.requesterName || 'Anfragender', row.title, requestUrl),
    ).catch((err) =>
      logger.error('Failed to send itHilfeCompleted email', {
        error: err,
        requestId: id,
      }),
    )

    return apiSuccess({ message: 'Anfrage als abgeschlossen markiert' })
  } catch (error) {
    logger.error('Error completing IT-Hilfe request', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
