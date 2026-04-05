import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { eq, and, sql } from 'drizzle-orm'
import { itHilfeRequests, itHilfeOffers, users } from '@/db/schema'
import { reviews } from '@/db/schema/reviews'
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
import { REVIEW_STATUS } from '@/config/review-status'
import { logger } from '@/lib/logger'
import { REQUEST_STATUS } from '@/config/it-hilfe'
import { sendCustomEmail } from '@/lib/email'
import { itHilfeReviewReceived } from '@/lib/email/templates/it-hilfe'
import { sendItHilfeNotification } from '@/lib/it-hilfe/notifications'
import { updateHelperAverageRating } from '@/lib/reviews/review-service'
import { APP_URL } from '@/config/urls'

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
      return apiBadRequest('Ungültige Anfrage-ID')
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
    if (reviewText && reviewText.length < 10) {
      return apiBadRequest(
        'Der Bewertungstext muss mindestens 10 Zeichen lang sein',
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

    if (!offer) return apiBadRequest('Helfer nicht gefunden')

    // Guard against duplicate reviews at the DB layer as well
    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(
        and(
          eq(reviews.reviewerId, session.user.id),
          eq(reviews.targetType, REVIEW_TARGET_TYPES.IT_HILFE),
          eq(reviews.targetId, id),
        ),
      )

    if (existing.length > 0) {
      return apiBadRequest('Diese Anfrage wurde bereits bewertet')
    }

    // Create review + stamp reviewed_at atomically. The recommendation flag
    // is encoded into the review content so existing review surfaces render
    // it without requiring a schema change.
    const recommendationLine = recommended
      ? '\n\n[Empfehlung: Ja, diesen Helfer gerne weiter]'
      : '\n\n[Empfehlung: Nein]'
    const content = (reviewText || 'Hilfe erfolgreich abgeschlossen.') + recommendationLine

    const reviewId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(reviews)
        .values({
          reviewerId: session.user.id,
          targetType: REVIEW_TARGET_TYPES.IT_HILFE,
          targetId: id,
          overallRating: rating,
          content,
          isVerifiedPurchase: true,
          status: REVIEW_STATUS.PUBLISHED,
        })
        .returning({ id: reviews.id })

      await tx
        .update(itHilfeRequests)
        .set({ reviewedAt: sql`NOW()` })
        .where(eq(itHilfeRequests.id, id))

      return created.id
    })

    // Update helper rolling average (best-effort)
    updateHelperAverageRating(id).catch((err) =>
      logger.error('Failed to update helper average rating', {
        error: err,
        requestId: id,
      }),
    )

    logger.info('IT-Hilfe review submitted', {
      requestId: id,
      reviewId,
      reviewerId: session.user.id,
      helperId: offer.helperId,
      rating,
    })

    // Thank-you notification + email to helper
    sendItHilfeNotification({
      recipientIds: [offer.helperId],
      title: 'Du hast eine Bewertung erhalten',
      content: `Vielen Dank für deine Hilfe! Du hast ${rating}/5 Sterne für "${row.title}" erhalten.`,
      requestId: id,
    })

    const requestUrl = `${APP_URL}/it-hilfe/${id}`
    sendCustomEmail(
      offer.helperEmail,
      itHilfeReviewReceived(
        offer.helperName || 'Helfer',
        row.title,
        rating,
        reviewText,
        requestUrl,
      ),
    ).catch((err) =>
      logger.error('Failed to send itHilfeReviewReceived email', {
        error: err,
        requestId: id,
      }),
    )

    return apiSuccess({
      message: 'Bewertung erfolgreich abgegeben',
      reviewId,
    })
  } catch (error) {
    logger.error('Error confirming IT-Hilfe review', { error })
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
