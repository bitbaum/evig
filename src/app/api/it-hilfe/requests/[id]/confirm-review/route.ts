import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, sql, getTableName } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers, users } from '@/db/schema'

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
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS, REVIEW_MIN_CHARS } from '@/config/it-hilfe'
import { notifyReviewReceived } from '@/lib/it-hilfe/notifications'
import { createReview, findDuplicateReview } from '@/lib/reviews/create-review'
import { guardedTransition } from '@/lib/lifecycle'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface ConfirmReviewBody {
  rating?: number
  reviewText?: string
  recommended?: boolean
}

/**
 * POST /api/it-hilfe/requests/[id]/confirm-review
 *
 * Requester confirms a completed IT-Hilfe request and submits a review.
 * Creates a published review record tied to the helper and stamps
 * reviewed_at on the request.
 */
export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
): Promise<NextResponse> => {
  try {
    const id = context?.params?.id
    if (!id || !UUID_REGEX.test(id)) {
      return apiBadRequest(ERROR_MESSAGES.INVALID_REQUEST_ID)
    }

    let body: ConfirmReviewBody
    try {
      body = (await request.json()) as ConfirmReviewBody
    } catch {
      return apiBadRequest('Ungültiger Request-Body')
    }

    const rating = Number(body.rating)
    const reviewText = (body.reviewText ?? '').trim()
    const recommended = body.recommended === true

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiBadRequest('Bewertung muss zwischen 1 und 5 liegen')
    }
    if (reviewText && reviewText.length < REVIEW_MIN_CHARS) {
      return apiBadRequest(
        `Der Bewertungstext muss mindestens ${REVIEW_MIN_CHARS} Zeichen lang sein`,
      )
    }

    // Load the request + matched helper info
    const [row] = await db
      .select({
        requestId: itHilfeRequests.id,
        requesterId: itHilfeRequests.requesterId,
        title: itHilfeRequests.title,
        status: itHilfeRequests.status,
        reviewedAt: itHilfeRequests.reviewedAt,
        matchedOfferId: itHilfeRequests.matchedOfferId,
      })
      .from(itHilfeRequests)
      .where(eq(itHilfeRequests.id, id))

    if (!row) return apiNotFound('IT-Hilfe-Anfrage')

    if (row.requesterId !== session.user.id) {
      return apiForbidden('Nur der Anfragende kann eine Bewertung abgeben')
    }

    if (row.status !== REQUEST_STATUS.COMPLETED) {
      return apiBadRequest(
        'Die Anfrage muss abgeschlossen sein, bevor sie bewertet werden kann',
      )
    }

    if (row.reviewedAt) {
      return apiBadRequest('Diese Anfrage wurde bereits bewertet')
    }

    if (!row.matchedOfferId) {
      return apiBadRequest('Kein akzeptiertes Angebot gefunden')
    }

    // Find the helper behind the accepted offer
    const [offer] = await db
      .select({
        helperId: itHilfeOffers.helperId,
        helperName: users.name,
        helperEmail: users.email,
      })
      .from(itHilfeOffers)
      .innerJoin(users, eq(itHilfeOffers.helperId, users.id))
      .where(eq(itHilfeOffers.id, row.matchedOfferId))

    if (!offer) return apiBadRequest('Techniker nicht gefunden')

    // Guard against duplicate reviews at the DB layer as well
    const existingId = await findDuplicateReview(session.user.id, REVIEW_TARGET_TYPES.IT_HILFE, id)
    if (existingId) {
      return apiBadRequest('Diese Anfrage wurde bereits bewertet')
    }

    // The recommendation flag is encoded into the review content so existing
    // review surfaces render it without requiring a schema change.
    const recommendationLine = recommended
      ? '\n\n[Empfehlung: Ja, diesen Techniker gerne weiter]'
      : '\n\n[Empfehlung: Nein]'
    const content = (reviewText || 'Hilfe erfolgreich abgeschlossen.') + recommendationLine

    // Race: requester double-clicks "Submit review". Both pass the outer
    // reviewedAt + findDuplicateReview checks and both call createReview
    // — the reviews table has uniqueIndex(reviewer_id, target_type,
    // target_id, booking_id) but booking_id is null for IT-Hilfe and
    // Postgres treats NULLs as distinct, so the constraint doesn't block
    // duplicates. Net: two review rows + double-counted rating in
    // repairer_profiles. Lock the request row with FOR UPDATE and re-
    // verify reviewedAt IS NULL inside a transaction. Stamp reviewedAt
    // there too so race-losers see it on their re-check. Same shape as
    // 90bdbabf / cc89b7f6 / f7b652b7. createReview runs OUTSIDE the
    // transaction (the lock already serialized us past the race window;
    // if createReview itself fails after the stamp commits, the user
    // sees "already reviewed" on retry — paper cut, no data corruption.)
    const stamped = await guardedTransition<{ reviewed_at: string | null }, void>({
      lockTable: reqTable,
      lockId: id,
      lockColumns: ['reviewed_at'],
      check: (r) => r.reviewed_at == null,
      apply: async (tx) => {
        await tx
          .update(itHilfeRequests)
          .set({ reviewedAt: sql`NOW()` })
          .where(eq(itHilfeRequests.id, id))
      },
    })

    if (!stamped.ok) {
      return apiBadRequest('Diese Anfrage wurde bereits bewertet')
    }

    // Create review via shared service (handles insert + rating update).
    // Safe to call outside the transaction now — request.reviewed_at is
    // set, so no concurrent caller can reach this line.
    const { reviewId } = await createReview({
      reviewerId: session.user.id,
      targetType: REVIEW_TARGET_TYPES.IT_HILFE,
      targetId: id,
      overallRating: rating,
      content,
      isVerifiedPurchase: true,
    })

    logger.info('IT-Hilfe review submitted', {
      requestId: id,
      reviewId,
      reviewerId: session.user.id,
      helperId: offer.helperId,
      rating,
    })

    notifyReviewReceived({
      recipientIds: [offer.helperId],
      requestId: id,
      helperName: offer.helperName || 'Techniker',
      requestTitle: row.title,
      rating,
      reviewText,
    })

    return apiSuccess({
      message: 'Bewertung erfolgreich abgegeben',
      reviewId,
    })
  } catch (error) {
    logger.error('Error confirming IT-Hilfe review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
