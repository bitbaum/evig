/**
 * POST /api/payments/payrexx-webhook — Handles Payrexx webhook callbacks.
 *
 * Payrexx sends transaction status updates here. We use the referenceId
 * (= our orderId) to look up the order, then verify the claimed status
 * against our records before updating.
 *
 * Key statuses:
 *   reserved  → order paid (amount held, not captured)
 *   confirmed → payment captured (order completed)
 *   cancelled → reservation released
 *   declined  → payment failed
 *   refunded / partially-refunded → refund processed
 */

import { NextRequest } from 'next/server';
import { db } from '@/db';
import { marketplaceOrders, listings, users } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { apiSuccess, apiError, apiBadRequest, apiUnauthorized, apiNotFound } from '@/lib/api/helpers';
import { sendCustomEmail } from '@/lib/email';
import {
  orderConfirmationBuyer,
  newOrderNotificationSeller,
} from '@/lib/email/templates/marketplace';
import { formatCHF, DELIVERY_LABELS, ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace';
import type { DeliveryOption } from '@/config/marketplace';

const PAYREXX_WEBHOOK_SECRET = process.env.PAYREXX_WEBHOOK_SECRET;

/**
 * Verify Payrexx webhook signature using HMAC-SHA256.
 * Returns true if signature is valid or if no secret is configured (dev mode).
 */
async function verifyPayrexxSignature(rawBody: string, signature: string | null): Promise<boolean> {
  if (!PAYREXX_WEBHOOK_SECRET) {
    logger.error('PAYREXX_WEBHOOK_SECRET not set — rejecting webhook (fail closed)');
    return false;
  }
  if (!signature) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(PAYREXX_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
  const computed = Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < computed.length; i++) {
    result |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

interface WebhookTransaction {
  id?: number;
  status?: string;
  referenceId?: string;
  amount?: number;
  currency?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('payrexx-signature');

    if (!await verifyPayrexxSignature(rawBody, signature)) {
      logger.warn('Payrexx webhook: invalid signature', { signature });
      return apiUnauthorized('Invalid signature');
    }

    const body = (() => { try { return JSON.parse(rawBody); } catch { return null; } })();
    if (!body) {
      return apiBadRequest('Invalid body');
    }

    // Payrexx webhook sends transaction data in `transaction` field
    const tx: WebhookTransaction = body.transaction || body;
    const referenceId = tx.referenceId || body.referenceId;
    const transactionId = tx.id ? String(tx.id) : null;
    const status = tx.status || body.status;

    if (!referenceId || !status) {
      logger.warn('Payrexx webhook: missing referenceId or status', { body });
      return apiBadRequest('Missing referenceId or status');
    }

    logger.info('Payrexx webhook received', { referenceId, transactionId, status });

    // Look up order by referenceId (= orderId)
    const orderRows = await db
      .select({
        id: marketplaceOrders.id,
        buyerId: marketplaceOrders.buyerId,
        sellerId: marketplaceOrders.sellerId,
        listingId: marketplaceOrders.listingId,
        amountChf: marketplaceOrders.amountChf,
        commissionChf: marketplaceOrders.commissionChf,
        sellerPayoutChf: marketplaceOrders.sellerPayoutChf,
        status: marketplaceOrders.status,
        deliveryMethod: marketplaceOrders.deliveryMethod,
        paymentProvider: marketplaceOrders.paymentProvider,
      })
      .from(marketplaceOrders)
      .where(eq(marketplaceOrders.id, referenceId))

    const order = orderRows[0];
    if (!order) {
      logger.warn('Payrexx webhook: order not found', { referenceId });
      return apiNotFound('Order');
    }

    // Process based on Payrexx status
    switch (status) {
      case 'reserved': {
        // Payment reserved — buyer has paid, amount is held
        if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
          logger.info('Payrexx webhook: order not in pending_payment, skipping', {
            orderId: order.id,
            currentStatus: order.status,
          });
          return apiSuccess({ received: true });
        }

        await db
          .update(marketplaceOrders)
          .set({
            status: ORDER_STATUS.PAID,
            payrexxTransactionId: transactionId,
            updatedAt: sql`NOW()`,
          })
          .where(eq(marketplaceOrders.id, order.id))

        logger.info('Marketplace order marked paid via Payrexx', {
          orderId: order.id,
          transactionId,
        });

        // Send email notifications (same as previously in order creation route)
        sendOrderEmails(order).catch(err =>
          logger.error('Failed to send order emails', { error: err, orderId: order.id })
        );
        break;
      }

      case 'confirmed': {
        // Payment captured — order completed
        if (order.status !== ORDER_STATUS.PAID && order.status !== ORDER_STATUS.DELIVERED) {
          logger.info('Payrexx webhook: unexpected confirmed status', {
            orderId: order.id,
            currentStatus: order.status,
          });
          return apiSuccess({ received: true });
        }

        await db
          .update(marketplaceOrders)
          .set({
            status: ORDER_STATUS.COMPLETED,
            updatedAt: sql`NOW()`,
          })
          .where(eq(marketplaceOrders.id, order.id))
        break;
      }

      case 'cancelled':
      case 'declined': {
        // Payment cancelled or declined
        if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
          return apiSuccess({ received: true });
        }

        await db
          .update(marketplaceOrders)
          .set({
            status: ORDER_STATUS.CANCELLED,
            updatedAt: sql`NOW()`,
          })
          .where(eq(marketplaceOrders.id, order.id))

        // Restore listing to active
        await db
          .update(listings)
          .set({ status: LISTING_STATUS.ACTIVE })
          .where(
            and(
              eq(listings.id, order.listingId),
              eq(listings.status, LISTING_STATUS.RESERVED)
            )
          )

        logger.info('Marketplace order cancelled via Payrexx webhook', {
          orderId: order.id,
          reason: status,
        });
        break;
      }

      case 'refunded':
      case 'partially-refunded': {
        await db
          .update(marketplaceOrders)
          .set({
            status: ORDER_STATUS.REFUNDED,
            updatedAt: sql`NOW()`,
          })
          .where(eq(marketplaceOrders.id, order.id))

        logger.info('Marketplace order refunded via Payrexx webhook', {
          orderId: order.id,
          status,
        });
        break;
      }

      default:
        logger.info('Payrexx webhook: unhandled status', { status, orderId: order.id });
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return apiError(error, 'Internal error');
  }
}

// ============================================================================
// Email notifications — fires after reservation confirmed
// ============================================================================

async function sendOrderEmails(order: {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amountChf: string;
  commissionChf: string;
  sellerPayoutChf: string;
  deliveryMethod: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const orderUrl = `${baseUrl}/dashboard/orders/${order.id}`;
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod;

  // Fetch listing title + buyer/seller info
  const infoRows = await db
    .select({
      title: listings.title,
      buyerName: users.name,
      buyerEmail: users.email,
    })
    .from(marketplaceOrders)
    .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
    .innerJoin(users, eq(marketplaceOrders.buyerId, users.id))
    .where(eq(marketplaceOrders.id, order.id))

  const buyerInfo = infoRows[0];
  if (!buyerInfo) return;

  // Fetch seller info separately (different user join)
  const sellerRows = await db
    .select({
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(users)
    .where(eq(users.id, order.sellerId))

  const sellerInfo = sellerRows[0];

  // Buyer confirmation
  if (buyerInfo.buyerEmail) {
    await sendCustomEmail(
      buyerInfo.buyerEmail,
      orderConfirmationBuyer({
        recipientName: buyerInfo.buyerName || 'Käufer',
        listingTitle: buyerInfo.title,
        amountChf: formatCHF(Number(order.amountChf)),
        commissionChf: formatCHF(Number(order.commissionChf)),
        deliveryMethod: deliveryLabel,
        orderUrl,
      })
    );
  }

  // Seller notification
  if (sellerInfo?.sellerEmail) {
    await sendCustomEmail(
      sellerInfo.sellerEmail,
      newOrderNotificationSeller({
        recipientName: sellerInfo.sellerName || 'Verkäufer',
        buyerName: buyerInfo.buyerName || 'Käufer',
        listingTitle: buyerInfo.title,
        payoutAmountChf: formatCHF(Number(order.sellerPayoutChf)),
        deliveryMethod: deliveryLabel,
        orderUrl: `${baseUrl}/dashboard/orders/${order.id}`,
      })
    );
  }
}
