/**
 * POST /api/marketplace/orders/[id]/review
 *
 * Buyer leaves a review on a completed marketplace order.
 * Creates a row in `reviews` (target_type='listing', target_id=listing.id),
 * updates the seller's average rating, and notifies the seller.
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db'
import { listings, marketplaceOrders, reviews, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ORDER_STATUS } from '@/config/marketplace'
import { REVIEW_TARGET_TYPES } from '@/config/database'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/schemas'
import { sendCustomEmail } from '@/lib/email'
import { orderReviewReceived } from '@/lib/email/templates/marketplace'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { APP_URL } from '@/config/urls'
import { createReview } from '@/lib/reviews/create-review'

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().trim().max(5000).optional().default(''),
  recommend: z.boolean().optional().default(true),
})

export const POST = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context,
) => {
  try {
    const orderId = context?.params?.id
    if (!orderId) return apiBadRequest(ERROR_MESSAGES.ORDER_ID_REQUIRED)

    const body = await request.json()
    const validation = validateBody(ReviewSchema, body)
    if (!validation.success) return validation.error
    const { rating, content, recommend } = validation.data

    // Load order + counterparty info
    const [order] = await db
      .select({
        id: marketplaceOrders.id,
        buyerId: marketplaceOrders.buyerId,
        sellerId: marketplaceOrders.sellerId,
        listingId: marketplaceOrders.listingId,
        status: marketplaceOrders.status,
        reviewedAt: marketplaceOrders.reviewedAt,
        listingTitle: listings.title,
        sellerName: sql<string | null>`su.name`,
        sellerEmail: sql<string | null>`su.email`,
        buyerName: sql<string | null>`bu.name`,
      })
      .from(marketplaceOrders)
      .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
      .innerJoin(sql`${users} su`, sql`${marketplaceOrders.sellerId} = su.id`)
      .innerJoin(sql`${users} bu`, sql`${marketplaceOrders.buyerId} = bu.id`)
      .where(eq(marketplaceOrders.id, orderId))

    if (!order) return apiNotFound('Bestellung')
    const listingId = order.listingId
    if (!listingId) return apiNotFound('Bestellung')

    if (order.buyerId !== session.user.id) {
      return apiForbidden('Nur der Käufer kann eine Bewertung abgeben')
    }

    const reviewableStates: string[] = [ORDER_STATUS.DELIVERED, ORDER_STATUS.COMPLETED]
    if (!reviewableStates.includes(order.status)) {
      return apiBadRequest(
        'Eine Bewertung ist erst nach Abschluss der Bestellung möglich',
      )
    }

    if (order.reviewedAt) {
      return apiBadRequest('Sie haben diese Bestellung bereits bewertet')
    }

    // Double-check via reviews table (target_type='listing', bookingId=orderId)
    const existing = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(
        eq(reviews.reviewerId, session.user.id),
        eq(reviews.targetType, REVIEW_TARGET_TYPES.LISTING),
        eq(reviews.targetId, listingId),
        eq(reviews.bookingId, orderId),
      ))
      .limit(1)

    if (existing.length > 0) {
      return apiBadRequest('Sie haben diese Bestellung bereits bewertet')
    }

    const reviewContent = content && content.length >= 10
      ? content
      : (recommend
        ? 'Empfehlung ohne weiteren Kommentar.'
        : 'Keine Empfehlung ohne weiteren Kommentar.')

    // Insert review + update seller rating via shared service
    const { reviewId } = await createReview({
      reviewerId: session.user.id,
      targetType: REVIEW_TARGET_TYPES.LISTING,
      targetId: listingId,
      bookingId: orderId,
      overallRating: rating,
      content: reviewContent,
      isVerifiedPurchase: true,
    })

    // Mark order as reviewed
    await db
      .update(marketplaceOrders)
      .set({
        reviewedAt: sql`NOW()`,
        updatedAt: sql`NOW()`,
      })
      .where(eq(marketplaceOrders.id, orderId))

    logger.info('Marketplace order review created', {
      orderId,
      reviewId,
      rating,
      buyerId: session.user.id,
      sellerId: order.sellerId,
    })

    // Notify seller — in-app bell only; the styled orderReviewReceived email
    // below is the single email for this event (skipEmail avoids a 2nd generic one).
    createNotification(order.sellerId, {
      type: NOTIFICATION_TYPES.MARKETPLACE,
      title: `Neue Bewertung: ${rating}/5 Sterne`,
      content: `${order.buyerName || 'Ein Käufer'} hat Ihr Inserat "${order.listingTitle}" bewertet.`,
    }, { skipEmail: true }).catch((err) =>
      logger.error('Failed to create seller notification for review', {
        error: err,
        orderId,
      }),
    )

    if (order.sellerEmail) {
      sendCustomEmail(
        order.sellerEmail,
        orderReviewReceived({
          recipientName: order.sellerName || 'Verkäufer',
          listingTitle: order.listingTitle,
          rating,
          content: reviewContent,
          reviewUrl: `${APP_URL}/dashboard/orders/${orderId}`,
        }),
      ).catch((err) =>
        logger.error('Failed to send review received email', { error: err, orderId }),
      )
    }

    return apiSuccess({
      reviewId,
      rating,
      orderId,
    })
  } catch (error) {
    return apiError(error, 'Fehler beim Speichern der Bewertung')
  }
})
