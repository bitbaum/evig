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
import { listings, marketplaceOrders, marketplaceOrderItems, sellerProfiles, users } from '@/db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace'
import { TABLE_NAMES } from '@/config/database'
import { guardedTransition } from '@/lib/lifecycle'
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
      .leftJoin(listings, eq(marketplaceOrders.listingId, listings.id))
      .innerJoin(sql`${users} bu`, sql`${marketplaceOrders.buyerId} = bu.id`)
      .innerJoin(sql`${users} su`, sql`${marketplaceOrders.sellerId} = su.id`)
      .where(eq(marketplaceOrders.id, orderId))

    if (!order) return apiNotFound('Bestellung')

    // Single-item orders carry listingId; cart orders carry their listings in
    // marketplace_order_items. Resolve affected listings + a display title.
    let affectedListingIds: string[]
    let displayTitle: string
    if (order.listingId) {
      affectedListingIds = [order.listingId]
      displayTitle = order.listingTitle ?? 'Artikel'
    } else {
      const items = await db
        .select({ listingId: marketplaceOrderItems.listingId, title: marketplaceOrderItems.title })
        .from(marketplaceOrderItems)
        .where(eq(marketplaceOrderItems.orderId, orderId))
        .orderBy(marketplaceOrderItems.createdAt)
      if (items.length === 0) return apiNotFound('Bestellung')
      affectedListingIds = items.map(i => i.listingId)
      displayTitle = items.length === 1 ? items[0].title : `${items[0].title} +${items.length - 1} weitere Artikel`
    }

    if (order.buyerId !== session.user.id) {
      return apiForbidden('Nur der Käufer kann den Empfang bestätigen')
    }

    const validStates: string[] = [ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]
    if (!validStates.includes(order.status)) {
      return apiBadRequest(
        'Empfang kann nur für versendete oder gelieferte Bestellungen bestätigt werden',
      )
    }

    // Capture escrow + complete the order race-safe. Lock the order row and
    // re-verify it is still shipped/delivered under the lock, so this route
    // and the PATCH route (the other path to COMPLETED) serialize against each
    // other — without the lock both could capture the Payrexx hold and bump
    // seller total_sold twice. Capture runs INSIDE the lock; a genuine retry
    // relies on Payrexx idempotency by transaction id.
    let paymentErrorMsg: string | null = null
    let result
    try {
      result = await guardedTransition<{ status: string }, void>({
        lockTable: TABLE_NAMES.MARKETPLACE_ORDERS,
        lockId: orderId,
        check: (r) => validStates.includes(r.status),
        apply: async (tx) => {
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
              paymentErrorMsg = 'Zahlung konnte nicht freigegeben werden'
              throw captureError
            }
          }

          await tx
            .update(marketplaceOrders)
            .set({
              status: ORDER_STATUS.COMPLETED,
              deliveredAt: sql`COALESCE(${marketplaceOrders.deliveredAt}, NOW())`,
              completedAt: sql`NOW()`,
              updatedAt: sql`NOW()`,
            })
            .where(eq(marketplaceOrders.id, orderId))
          await tx
            .update(listings)
            .set({ status: LISTING_STATUS.SOLD })
            .where(inArray(listings.id, affectedListingIds))
          await tx
            .update(sellerProfiles)
            .set({ totalSold: sql`COALESCE(${sellerProfiles.totalSold}, 0) + ${affectedListingIds.length}` })
            .where(eq(sellerProfiles.userId, order.sellerId))
        },
      })
    } catch (txError) {
      if (paymentErrorMsg) return apiError(txError, paymentErrorMsg)
      throw txError
    }

    if (!result.ok) {
      // The order left shipped/delivered under us (e.g. a concurrent
      // confirm-receipt won). The end-state is the same; treat as done.
      return apiSuccess({ orderId, status: ORDER_STATUS.COMPLETED })
    }

    logger.info('Buyer confirmed receipt', {
      orderId,
      buyerId: session.user.id,
      sellerId: order.sellerId,
    })

    // Notify seller — in-app bell only; the styled orderReceiptConfirmed email
    // below is the single email for this event (skipEmail avoids a 2nd generic one).
    createNotification(order.sellerId, {
      type: NOTIFICATION_TYPES.MARKETPLACE,
      title: 'Empfang bestätigt',
      content: `Der Käufer hat den Erhalt von "${displayTitle}" bestätigt. Die Zahlung wurde freigegeben.`,
    }, { skipEmail: true }).catch((err) =>
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
          listingTitle: displayTitle,
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
          listingTitle: displayTitle,
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
