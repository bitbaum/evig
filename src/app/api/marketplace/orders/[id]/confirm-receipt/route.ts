/**
 * POST /api/marketplace/orders/[id]/confirm-receipt
 *
 * Buyer confirms they received the item. Transitions the order to 'completed'
 * (final state), releases any Payrexx escrow hold, updates the listing to sold,
 * notifies the seller, and prompts the buyer to leave a review.
 *
 * Allowed current states: 'shipped' or 'delivered'.
 */

import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db'
import { listings, marketplaceOrders, sellerProfiles, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace'
import { logger } from '@/lib/logger'
import { captureTransaction } from '@/lib/payments/payrexx-client'
import { sendCustomEmail } from '@/lib/email'
import { orderReceiptConfirmed, orderReviewPrompt } from '@/lib/email/templates/marketplace'
import { createNotification } from '@/lib/services/notifications'
import { NOTIFICATION_TYPES } from '@/config/notifications'
import { APP_URL } from '@/config/urls'

export const POST = withAuth<{ id: string }>(async (
  _request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const orderId = context?.params?.id
    if (!orderId) return apiBadRequest(ERROR_MESSAGES.ORDER_ID_REQUIRED)

    // Fetch order + listing + buyer/seller info
    const [order] = await db
      .select({
        id: marketplaceOrders.id,
        buyerId: marketplaceOrders.buyerId,
        sellerId: marketplaceOrders.sellerId,
        listingId: marketplaceOrders.listingId,
        amountChf: marketplaceOrders.amountChf,
        status: marketplaceOrders.status,
        payrexxTransactionId: marketplaceOrders.payrexxTransactionId,
        listingTitle: listings.title,
        buyerName: sql<string | null>`bu.name`,
        buyerEmail: sql<string | null>`bu.email`,
        sellerName: sql<string | null>`su.name`,
        sellerEmail: sql<string | null>`su.email`,
      })
      .from(marketplaceOrders)
      .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
      .innerJoin(sql`${users} bu`, sql`${marketplaceOrders.buyerId} = bu.id`)
      .innerJoin(sql`${users} su`, sql`${marketplaceOrders.sellerId} = su.id`)
      .where(eq(marketplaceOrders.id, orderId))

    if (!order) return apiNotFound('Bestellung')

    if (order.buyerId !== session.user.id) {
      return apiForbidden('Nur der Käufer kann den Empfang bestätigen')
    }

    const validStates: string[] = [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]
    if (!validStates.includes(order.status)) {
      return apiBadRequest(
        'Empfang kann nur für versendete oder gelieferte Bestellungen bestätigt werden',
      )
    }

    // Release escrow if there is a Payrexx hold
    if (order.payrexxTransactionId) {
      try {
        await captureTransaction(
          order.payrexxTransactionId,
          Math.round(Number(order.amountChf) * 100),
        )
      } catch (captureError) {
        logger.error('Failed to capture Payrexx transaction on receipt confirmation', {
          captureError,
          orderId,
        })
        return apiError(captureError, 'Zahlung konnte nicht freigegeben werden')
      }
    }

    // All three state updates are independent — run in parallel
    await Promise.all([
      // Mark order completed
      db
        .update(marketplaceOrders)
        .set({
          status: ORDER_STATUS.COMPLETED,
          deliveredAt: sql`COALESCE(${marketplaceOrders.deliveredAt}, NOW())`,
          completedAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(marketplaceOrders.id, orderId)),
      // Mark listing as sold
      db
        .update(listings)
        .set({ status: LISTING_STATUS.SOLD })
        .where(eq(listings.id, order.listingId)),
      // Increment seller total_sold
      db
        .update(sellerProfiles)
        .set({ totalSold: sql`COALESCE(${sellerProfiles.totalSold}, 0) + 1` })
        .where(eq(sellerProfiles.userId, order.sellerId)),
    ])

    logger.info('Buyer confirmed receipt', {
      orderId,
      buyerId: session.user.id,
      sellerId: order.sellerId,
    })

    // Notify seller (in-app + email fallback via notification service)
    createNotification(order.sellerId, {
      type: NOTIFICATION_TYPES.MARKETPLACE,
      title: 'Empfang bestätigt',
      content: `Der Käufer hat den Erhalt von "${order.listingTitle}" bestätigt. Die Zahlung wurde freigegeben.`,
    }).catch((err) =>
      logger.error('Failed to create seller notification on receipt confirmation', {
        error: err,
        orderId,
      }),
    )

    // Email to seller
    if (order.sellerEmail) {
      sendCustomEmail(
        order.sellerEmail,
        orderReceiptConfirmed({
          recipientName: order.sellerName || 'Verkäufer',
          orderNumber: orderId,
          listingTitle: order.listingTitle,
          orderUrl: `${APP_URL}/dashboard/orders/${orderId}`,
        }),
      ).catch((err) =>
        logger.error('Failed to send seller receipt confirmation email', {
          error: err,
          orderId,
        }),
      )
    }

    // Review prompt to buyer
    if (order.buyerEmail) {
      sendCustomEmail(
        order.buyerEmail,
        orderReviewPrompt({
          recipientName: order.buyerName || 'Käufer',
          listingTitle: order.listingTitle,
          reviewUrl: `${APP_URL}/dashboard/orders/${orderId}`,
        }),
      ).catch((err) =>
        logger.error('Failed to send buyer review prompt email', {
          error: err,
          orderId,
        }),
      )
    }

    return apiSuccess({ orderId, status: ORDER_STATUS.COMPLETED })
  } catch (error) {
    return apiError(error, 'Fehler beim Bestätigen des Empfangs')
  }
})
