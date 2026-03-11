/**
 * GET   /api/marketplace/orders/[id] — Order detail (buyer or seller only)
 * PATCH /api/marketplace/orders/[id] — Update order status (role-based transitions)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages, marketplaceOrders, sellerProfiles, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ORDER_STATUS_CONFIG, ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace';
import type { OrderStatus } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, UpdateOrderStatusSchema } from '@/lib/schemas';
import { captureTransaction, cancelTransaction } from '@/lib/payments/payrexx-client';
import { sendCustomEmail } from '@/lib/email';
import { orderStatusUpdate } from '@/lib/email/templates/marketplace';

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
      createdAt: marketplaceOrders.createdAt,
      updatedAt: marketplaceOrders.updatedAt,
      listingTitle: listings.title,
      thumbnail: sql<string | null>`(
        SELECT ${listingImages.url} FROM ${listingImages}
        WHERE ${listingImages.listingId} = ${listings.id}
          AND ${listingImages.isPrimary} = true
        LIMIT 1
      )`,
      buyerName: sql<string | null>`bu.name`,
      buyerEmail: sql<string | null>`bu.email`,
      sellerName: sql<string | null>`su.name`,
      sellerEmail: sql<string | null>`su.email`,
    })
    .from(marketplaceOrders)
    .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
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
    if (!orderId) return apiBadRequest('Bestell-ID fehlt');

    const order = await fetchOrderWithDetails(orderId);
    if (!order) return apiNotFound('Bestellung');

    // Must be buyer or seller
    if (order.buyerId !== session.user.id && order.sellerId !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diese Bestellung');
    }

    const role = order.buyerId === session.user.id ? 'buyer' : 'seller';

    return apiSuccess({
      ...order,
      role,
      counterpartyName: role === 'buyer' ? order.sellerName : order.buyerName,
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
    if (!orderId) return apiBadRequest('Bestell-ID fehlt');

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

    // Handle payment operations for specific transitions
    if (newStatus === ORDER_STATUS.COMPLETED && order.payrexxTransactionId) {
      // Capture the held Payrexx reservation
      try {
        await captureTransaction(order.payrexxTransactionId, Math.round(Number(order.amountChf) * 100));
      } catch (captureError) {
        logger.error('Failed to capture Payrexx transaction', { captureError, orderId });
        return apiError(captureError, 'Zahlung konnte nicht abgeschlossen werden');
      }
    }

    if (newStatus === ORDER_STATUS.CANCELLED && order.status !== ORDER_STATUS.PENDING_PAYMENT && order.payrexxTransactionId) {
      // Cancel/release the Payrexx reservation
      try {
        await cancelTransaction(order.payrexxTransactionId);
      } catch (cancelError) {
        logger.error('Failed to cancel Payrexx transaction', { cancelError, orderId });
        return apiError(cancelError, 'Zahlung konnte nicht storniert werden');
      }
    }

    // Build update values
    const updateValues: Record<string, unknown> = {
      status: newStatus,
      updatedAt: sql`NOW()`,
    };

    // Store tracking info in shipping_address JSONB
    if (tracking_number || tracking_url) {
      updateValues.shippingAddress = sql`COALESCE(${marketplaceOrders.shippingAddress}, '{}') || ${JSON.stringify({
        ...(tracking_number && { tracking_number }),
        ...(tracking_url && { tracking_url }),
      })}::jsonb`;
    }

    await db
      .update(marketplaceOrders)
      .set(updateValues)
      .where(eq(marketplaceOrders.id, orderId));

    // If completed: update listing status to sold and increment seller total_sold
    if (newStatus === ORDER_STATUS.COMPLETED) {
      await db
        .update(listings)
        .set({ status: LISTING_STATUS.SOLD })
        .where(eq(listings.id, order.listingId));

      await db
        .update(sellerProfiles)
        .set({ totalSold: sql`${sellerProfiles.totalSold} + 1` })
        .where(eq(sellerProfiles.userId, order.sellerId));
    }

    // If cancelled: restore listing to active
    if (newStatus === ORDER_STATUS.CANCELLED) {
      await db
        .update(listings)
        .set({ status: LISTING_STATUS.ACTIVE })
        .where(and(
          eq(listings.id, order.listingId),
          eq(listings.status, LISTING_STATUS.RESERVED),
        ));
    }

    logger.info('Marketplace order status updated', {
      orderId,
      from: currentStatus,
      to: newStatus,
      by: session.user.id,
      role,
    });

    // Fire-and-forget: email notification to counterparty
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const statusConfig = ORDER_STATUS_CONFIG[newStatus as OrderStatus];
    const counterpartyEmail = role === 'buyer' ? order.sellerEmail : order.buyerEmail;
    const counterpartyName = role === 'buyer' ? order.sellerName : order.buyerName;

    const actionHints: Record<string, string> = {
      [ORDER_STATUS.SHIPPED]: 'Ihr Paket ist unterwegs. Bitte bestätigen Sie den Empfang.',
      [ORDER_STATUS.DELIVERED]: 'Bitte überprüfen Sie den Artikel und bestätigen Sie den Empfang.',
      [ORDER_STATUS.COMPLETED]: 'Die Zahlung wurde freigegeben. Vielen Dank!',
      [ORDER_STATUS.CANCELLED]: 'Die Bestellung wurde storniert.',
    };

    if (counterpartyEmail && statusConfig) {
      sendCustomEmail(
        counterpartyEmail,
        orderStatusUpdate({
          recipientName: counterpartyName || 'Nutzer',
          listingTitle: order.listingTitle,
          newStatusLabel: statusConfig.label,
          actionHint: actionHints[newStatus] || '',
          orderUrl: `${baseUrl}/dashboard/orders/${orderId}`,
        })
      ).catch(err => logger.error('Failed to send order status update email', { error: err, orderId, newStatus }));
    }

    return apiSuccess({ orderId, status: newStatus });
  } catch (error) {
    return apiError(error, 'Fehler beim Aktualisieren des Bestellstatus');
  }
});
