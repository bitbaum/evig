/**
 * GET   /api/marketplace/orders/[id] — Order detail (buyer or seller only)
 * PATCH /api/marketplace/orders/[id] — Update order status (role-based transitions)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers';
import { ERROR_MESSAGES } from '@/config/error-messages'
import { db } from '@/db';
import { listings, listingImages, marketplaceOrders, marketplaceOrderItems, sellerProfiles, users } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { ORDER_STATUS_CONFIG, ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace';
import type { OrderStatus } from '@/config/marketplace';
import { TABLE_NAMES } from '@/config/database';
import { guardedTransition } from '@/lib/lifecycle';
import { logger } from '@/lib/logger';
import { validateBody, UpdateOrderStatusSchema } from '@/lib/schemas';
import { captureTransaction, cancelTransaction } from '@/lib/payments/payrexx-client';
import { sendCustomEmail } from '@/lib/email';
import { orderStatusUpdate } from '@/lib/email/templates/marketplace';
import { APP_URL } from '@/config/urls';

// Valid status transitions: { currentStatus: { role: [allowedNewStatuses] } }
const STATUS_TRANSITIONS: Record<string, Record<string, string[]>> = {
  [ORDER_STATUS.PAID]:      { seller: [ORDER_STATUS.SHIPPED],    buyer: [ORDER_STATUS.CANCELLED] },
  [ORDER_STATUS.SHIPPED]:   { seller: [ORDER_STATUS.DELIVERED],  buyer: [] },
  [ORDER_STATUS.DELIVERED]: { buyer: [ORDER_STATUS.COMPLETED],   seller: [] },
};

/**
 * Fetch order with full join data (listing, buyer, seller).
 * Used by both GET and PATCH handlers.
 */
async function fetchOrderWithDetails(orderId: string) {
  const [order] = await db
    .select({
      id: marketplaceOrders.id,
      buyerId: marketplaceOrders.buyerId,
      sellerId: marketplaceOrders.sellerId,
      listingId: marketplaceOrders.listingId,
      amountChf: marketplaceOrders.amountChf,
      commissionChf: marketplaceOrders.commissionChf,
      sellerPayoutChf: marketplaceOrders.sellerPayoutChf,
      stripePaymentIntentId: marketplaceOrders.stripePaymentIntentId,
      payrexxTransactionId: marketplaceOrders.payrexxTransactionId,
      paymentProvider: marketplaceOrders.paymentProvider,
      status: marketplaceOrders.status,
      deliveryMethod: marketplaceOrders.deliveryMethod,
      shippingAddress: marketplaceOrders.shippingAddress,
      deliveredAt: marketplaceOrders.deliveredAt,
      completedAt: marketplaceOrders.completedAt,
      reviewedAt: marketplaceOrders.reviewedAt,
      createdAt: marketplaceOrders.createdAt,
      updatedAt: marketplaceOrders.updatedAt,
      // Cart orders (listingId null) have no listing row — fall back to the
      // first order-item title and the first item's image.
      listingTitle: sql<string | null>`COALESCE(${listings.title}, (
        SELECT it.title FROM ${marketplaceOrderItems} it
        WHERE it.order_id = ${marketplaceOrders.id}
        ORDER BY it.created_at LIMIT 1
      ))`,
      itemCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${marketplaceOrderItems} it
        WHERE it.order_id = ${marketplaceOrders.id}
      )`,
      thumbnail: sql<string | null>`COALESCE(
        (SELECT ${listingImages.url} FROM ${listingImages}
           WHERE ${listingImages.listingId} = ${listings.id}
             AND ${listingImages.isPrimary} = true LIMIT 1),
        (SELECT li.url FROM ${listingImages} li
           JOIN ${marketplaceOrderItems} it ON it.listing_id = li.listing_id
           WHERE it.order_id = ${marketplaceOrders.id} AND li.is_primary = true
           ORDER BY it.created_at LIMIT 1)
      )`,
      buyerName: sql<string | null>`bu.name`,
      buyerEmail: sql<string | null>`bu.email`,
      sellerName: sql<string | null>`su.name`,
      sellerEmail: sql<string | null>`su.email`,
    })
    .from(marketplaceOrders)
    .leftJoin(listings, eq(marketplaceOrders.listingId, listings.id))
    .innerJoin(
      sql`${users} bu`,
      sql`${marketplaceOrders.buyerId} = bu.id`
    )
    .innerJoin(
      sql`${users} su`,
      sql`${marketplaceOrders.sellerId} = su.id`
    )
    .where(eq(marketplaceOrders.id, orderId));

  return order ?? null;
}

// ============================================================================
// GET — Order detail
// ============================================================================

export const GET = withAuth<{ id: string }>(async (
  _request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const orderId = context?.params?.id;
    if (!orderId) return apiBadRequest(ERROR_MESSAGES.ORDER_ID_REQUIRED);

    const order = await fetchOrderWithDetails(orderId);
    if (!order) return apiNotFound('Bestellung');

    // Must be buyer or seller
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diese Bestellung');
    }

    const role = order.buyerId === session.user.id ? 'buyer' : 'seller';

    // Cart orders aggregate multiple line items; single-item orders have none.
    const items = order.itemCount > 0
      ? await db
          .select({
            id: marketplaceOrderItems.id,
            listingId: marketplaceOrderItems.listingId,
            title: marketplaceOrderItems.title,
            unitPriceChf: marketplaceOrderItems.unitPriceChf,
            quantity: marketplaceOrderItems.quantity,
            thumbnail: sql<string | null>`(
              SELECT ${listingImages.url} FROM ${listingImages}
              WHERE ${listingImages.listingId} = ${marketplaceOrderItems.listingId}
                AND ${listingImages.isPrimary} = true LIMIT 1
            )`,
          })
          .from(marketplaceOrderItems)
          .where(eq(marketplaceOrderItems.orderId, orderId))
          .orderBy(marketplaceOrderItems.createdAt)
      : [];

    return apiSuccess({
      ...order,
      role,
      counterpartyName: role === 'buyer' ? order.sellerName : order.buyerName,
      items,
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Bestellung');
  }
});

// ============================================================================
// PATCH — Update order status
// ============================================================================

export const PATCH = withAuth<{ id: string }>(async (
  request: NextRequest,
  session: ValidSession,
  context
) => {
  try {
    const orderId = context?.params?.id;
    if (!orderId) return apiBadRequest(ERROR_MESSAGES.ORDER_ID_REQUIRED);

    const body = await request.json();
    const validation = validateBody(UpdateOrderStatusSchema, body);
    if (!validation.success) return validation.error;
    const { status: newStatus, tracking_number, tracking_url } = validation.data;

    // Fetch current order
    const order = await fetchOrderWithDetails(orderId);
    if (!order) return apiNotFound('Bestellung');

    // Determine role
    const role = order.buyerId === session.user.id
      ? 'buyer'
      : order.sellerId === session.user.id
      ? 'seller'
      : null;

    if (!role) return apiForbidden('Kein Zugriff auf diese Bestellung');

    // Validate status transition
    const currentStatus = order.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus]?.[role] || [];

    // Allow cancellation from pending_payment for either role
    if (currentStatus === ORDER_STATUS.PENDING_PAYMENT && newStatus === ORDER_STATUS.CANCELLED) {
      // OK — allowed
    } else if (!allowedTransitions.includes(newStatus)) {
      return apiBadRequest(
        `Statuswechsel von "${ORDER_STATUS_CONFIG[currentStatus as OrderStatus]?.label || currentStatus}" ` +
        `zu "${ORDER_STATUS_CONFIG[newStatus as OrderStatus]?.label || newStatus}" ist nicht erlaubt`
      );
    }

    // Apply the transition race-safe. Lock the order row, re-validate the
    // transition under the lock, then run the Payrexx capture/cancel + status
    // write + listing side-effects atomically. Without the lock, the two paths
    // that reach COMPLETED (this PATCH and the confirm-receipt route) or a
    // double-click could both pass the read-time check and double-capture the
    // Payrexx reservation + double-bump seller total_sold. Payment ops run
    // INSIDE the lock (orders are low volume; correctness > lock duration); a
    // genuine retry relies on Payrexx idempotency by transaction id.
    let paymentErrorMsg: string | null = null
    let result
    try {
      result = await guardedTransition<{ status: string }, void>({
        lockTable: TABLE_NAMES.MARKETPLACE_ORDERS,
        lockId: orderId,
        check: (r) => {
          if (r.status === ORDER_STATUS.PENDING_PAYMENT && newStatus === ORDER_STATUS.CANCELLED) return true
          return (STATUS_TRANSITIONS[r.status]?.[role] || []).includes(newStatus)
        },
        apply: async (tx, r) => {
          // Payment operations (under the lock)
          if (newStatus === ORDER_STATUS.COMPLETED && order.payrexxTransactionId) {
            try {
              await captureTransaction(order.payrexxTransactionId, Math.round(Number(order.amountChf) * 100))
            } catch (captureError) {
              logger.error('Failed to capture Payrexx transaction', { captureError, orderId })
              paymentErrorMsg = 'Zahlung konnte nicht abgeschlossen werden'
              throw captureError
            }
          }
          if (newStatus === ORDER_STATUS.CANCELLED && r.status !== ORDER_STATUS.PENDING_PAYMENT && order.payrexxTransactionId) {
            try {
              await cancelTransaction(order.payrexxTransactionId)
            } catch (cancelError) {
              logger.error('Failed to cancel Payrexx transaction', { cancelError, orderId })
              paymentErrorMsg = 'Zahlung konnte nicht storniert werden'
              throw cancelError
            }
          }

          // Status write (+ tracking info in shipping_address JSONB)
          const updateValues: Record<string, unknown> = {
            status: newStatus,
            updatedAt: sql`NOW()`,
          }
          if (tracking_number || tracking_url) {
            updateValues.shippingAddress = sql`COALESCE(${marketplaceOrders.shippingAddress}, '{}') || ${JSON.stringify({
              ...(tracking_number && { tracking_number }),
              ...(tracking_url && { tracking_url }),
            })}::jsonb`
          }
          await tx.update(marketplaceOrders).set(updateValues).where(eq(marketplaceOrders.id, orderId))

          // Single-item P2P orders carry a listing directly; cart orders
          // (listing_id null) carry their listings in marketplace_order_items.
          // Resolve the affected listing ids so completion/cancellation acts on all.
          let affectedListingIds: string[] = []
          if (order.listingId) {
            affectedListingIds = [order.listingId]
          } else {
            const items = await tx
              .select({ listingId: marketplaceOrderItems.listingId })
              .from(marketplaceOrderItems)
              .where(eq(marketplaceOrderItems.orderId, orderId))
            affectedListingIds = items.map(i => i.listingId)
          }

          // If completed: mark listing(s) SOLD + bump seller total_sold (once per item).
          if (newStatus === ORDER_STATUS.COMPLETED && affectedListingIds.length > 0) {
            await tx.update(listings)
              .set({ status: LISTING_STATUS.SOLD })
              .where(inArray(listings.id, affectedListingIds))
            await tx.update(sellerProfiles)
              .set({ totalSold: sql`${sellerProfiles.totalSold} + ${affectedListingIds.length}` })
              .where(eq(sellerProfiles.userId, order.sellerId))
          }

          // If cancelled: restore reserved listing(s) to active
          if (newStatus === ORDER_STATUS.CANCELLED && affectedListingIds.length > 0) {
            await tx.update(listings)
              .set({ status: LISTING_STATUS.ACTIVE })
              .where(and(
                inArray(listings.id, affectedListingIds),
                eq(listings.status, LISTING_STATUS.RESERVED),
              ))
          }
        },
      })
    } catch (txError) {
      // A payment-op failure rolled the transaction back (no status change);
      // surface the specific message. Anything else bubbles to the outer catch.
      if (paymentErrorMsg) return apiError(txError, paymentErrorMsg)
      throw txError
    }

    if (!result.ok) {
      // The order changed under us between the read-time check and the lock
      // (concurrent transition); the requested transition is no longer valid.
      return apiBadRequest('Der Status der Bestellung hat sich geändert. Bitte Seite neu laden.')
    }

    logger.info('Marketplace order status updated', {
      orderId,
      from: currentStatus,
      to: newStatus,
      by: session.user.id,
      role,
    });

    // Fire-and-forget: email notification to counterparty
    const statusConfig = ORDER_STATUS_CONFIG[newStatus as OrderStatus];
    const counterpartyEmail = role === 'buyer' ? order.sellerEmail : order.buyerEmail;
    const counterpartyName = role === 'buyer' ? order.sellerName : order.buyerName;

    const actionHints: Record<string, string> = {
      [ORDER_STATUS.SHIPPED]: 'Dein Paket ist unterwegs. Bitte bestätige den Empfang.',
      [ORDER_STATUS.DELIVERED]: 'Bitte überprüfe den Artikel und bestätige den Empfang.',
      [ORDER_STATUS.COMPLETED]: 'Die Zahlung wurde freigegeben. Vielen Dank!',
      [ORDER_STATUS.CANCELLED]: 'Die Bestellung wurde storniert.',
    };

    if (counterpartyEmail && statusConfig) {
      sendCustomEmail(
        counterpartyEmail,
        orderStatusUpdate({
          recipientName: counterpartyName || 'Nutzer',
          listingTitle: order.listingTitle || 'Artikel',
          newStatusLabel: statusConfig.label,
          actionHint: actionHints[newStatus] || '',
          orderUrl: `${APP_URL}/dashboard/orders/${orderId}`,
        })
      ).catch(err => logger.error('Failed to send order status update email', { error: err, orderId, newStatus }));
    }

    return apiSuccess({ orderId, status: newStatus });
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Bestellstatus');
  }
});
