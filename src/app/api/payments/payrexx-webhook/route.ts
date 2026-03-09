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
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
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
    const orderResult = await query<{
      id: string;
      buyer_id: string;
      seller_id: string;
      listing_id: string;
      amount_chf: number;
      commission_chf: number;
      seller_payout_chf: number;
      status: string;
      delivery_method: string;
      payment_provider: string;
    }>(
      `SELECT id, buyer_id, seller_id, listing_id, amount_chf, commission_chf,
              seller_payout_chf, status, delivery_method, payment_provider
       FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} WHERE id = $1`,
      [referenceId]
    );

    const order = orderResult.rows[0];
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

        await query(
          `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS}
           SET status = $1, payrexx_transaction_id = $2, updated_at = NOW()
           WHERE id = $3`,
          [ORDER_STATUS.PAID, transactionId, order.id]
        );

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

        await query(
          `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS}
           SET status = $1, updated_at = NOW()
           WHERE id = $2`,
          [ORDER_STATUS.COMPLETED, order.id]
        );
        break;
      }

      case 'cancelled':
      case 'declined': {
        // Payment cancelled or declined
        if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
          return apiSuccess({ received: true });
        }

        await query(
          `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS}
           SET status = $1, updated_at = NOW()
           WHERE id = $2`,
          [ORDER_STATUS.CANCELLED, order.id]
        );

        // Restore listing to active
        await query(
          `UPDATE ${TABLE_NAMES.LISTINGS} SET status = $1
           WHERE id = $2 AND status = $3`,
          [LISTING_STATUS.ACTIVE, order.listing_id, LISTING_STATUS.RESERVED]
        );

        logger.info('Marketplace order cancelled via Payrexx webhook', {
          orderId: order.id,
          reason: status,
        });
        break;
      }

      case 'refunded':
      case 'partially-refunded': {
        await query(
          `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS}
           SET status = $1, updated_at = NOW()
           WHERE id = $2`,
          [ORDER_STATUS.REFUNDED, order.id]
        );

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
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount_chf: number;
  commission_chf: number;
  seller_payout_chf: number;
  delivery_method: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const orderUrl = `${baseUrl}/dashboard/orders/${order.id}`;
  const deliveryLabel = DELIVERY_LABELS[order.delivery_method as DeliveryOption] || order.delivery_method;

  // Fetch listing title + buyer/seller info
  const infoResult = await query<{
    title: string;
    buyer_name: string | null;
    buyer_email: string | null;
    seller_name: string | null;
    seller_email: string | null;
  }>(
    `SELECT l.title,
            bu.name as buyer_name, bu.email as buyer_email,
            su.name as seller_name, su.email as seller_email
     FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
     JOIN ${TABLE_NAMES.LISTINGS} l ON o.listing_id = l.id
     JOIN ${TABLE_NAMES.USERS} bu ON o.buyer_id = bu.id
     JOIN ${TABLE_NAMES.USERS} su ON o.seller_id = su.id
     WHERE o.id = $1`,
    [order.id]
  );

  const info = infoResult.rows[0];
  if (!info) return;

  // Buyer confirmation
  if (info.buyer_email) {
    await sendCustomEmail(
      info.buyer_email,
      orderConfirmationBuyer({
        recipientName: info.buyer_name || 'Käufer',
        listingTitle: info.title,
        amountChf: formatCHF(Number(order.amount_chf)),
        commissionChf: formatCHF(Number(order.commission_chf)),
        deliveryMethod: deliveryLabel,
        orderUrl,
      })
    );
  }

  // Seller notification
  if (info.seller_email) {
    await sendCustomEmail(
      info.seller_email,
      newOrderNotificationSeller({
        recipientName: info.seller_name || 'Verkäufer',
        buyerName: info.buyer_name || 'Käufer',
        listingTitle: info.title,
        payoutAmountChf: formatCHF(Number(order.seller_payout_chf)),
        deliveryMethod: deliveryLabel,
        orderUrl: `${baseUrl}/dashboard/orders/${order.id}`,
      })
    );
  }
}
