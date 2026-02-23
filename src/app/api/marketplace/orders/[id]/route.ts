/**
 * GET   /api/marketplace/orders/[id] — Order detail (buyer or seller only)
 * PATCH /api/marketplace/orders/[id] — Update order status (role-based transitions)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden, apiNotFound } from '@/lib/api/helpers';
import { query } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { ORDER_STATUS_CONFIG } from '@/config/marketplace';
import type { OrderStatus } from '@/config/marketplace';
import { formatCHF, DELIVERY_LABELS } from '@/config/marketplace';
import type { DeliveryOption } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, UpdateOrderStatusSchema } from '@/lib/schemas';
import { getStripeClient } from '@/lib/payments/stripe-client';
import { sendCustomEmail } from '@/lib/email';
import { orderStatusUpdate } from '@/lib/email/templates/marketplace';

interface OrderRow {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount_chf: number;
  commission_chf: number;
  seller_payout_chf: number;
  stripe_payment_intent_id: string | null;
  status: string;
  delivery_method: string;
  shipping_address: unknown;
  created_at: string;
  updated_at: string;
  listing_title: string;
  thumbnail: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  seller_name: string | null;
  seller_email: string | null;
}

// Valid status transitions: { currentStatus: { role: [allowedNewStatuses] } }
const STATUS_TRANSITIONS: Record<string, Record<string, string[]>> = {
  paid:      { seller: ['shipped'],    buyer: ['cancelled'] },
  shipped:   { seller: ['delivered'],  buyer: [] },
  delivered: { buyer: ['completed'],   seller: [] },
};

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

    const result = await query<OrderRow>(
      `SELECT
        o.*,
        l.title as listing_title,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail,
        bu.name as buyer_name,
        bu.email as buyer_email,
        su.name as seller_name,
        su.email as seller_email
      FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
      JOIN ${TABLE_NAMES.LISTINGS} l ON o.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} bu ON o.buyer_id = bu.id
      JOIN ${TABLE_NAMES.USERS} su ON o.seller_id = su.id
      WHERE o.id = $1`,
      [orderId]
    );

    const order = result.rows[0];
    if (!order) return apiNotFound('Bestellung');

    // Must be buyer or seller
    if (order.buyer_id !== session.user.id && order.seller_id !== session.user.id) {
      return apiForbidden('Kein Zugriff auf diese Bestellung');
    }

    const role = order.buyer_id === session.user.id ? 'buyer' : 'seller';

    return apiSuccess({
      ...order,
      role,
      counterparty_name: role === 'buyer' ? order.seller_name : order.buyer_name,
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
    const result = await query<OrderRow>(
      `SELECT
        o.*,
        l.title as listing_title,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail,
        bu.name as buyer_name,
        bu.email as buyer_email,
        su.name as seller_name,
        su.email as seller_email
      FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
      JOIN ${TABLE_NAMES.LISTINGS} l ON o.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} bu ON o.buyer_id = bu.id
      JOIN ${TABLE_NAMES.USERS} su ON o.seller_id = su.id
      WHERE o.id = $1`,
      [orderId]
    );

    const order = result.rows[0];
    if (!order) return apiNotFound('Bestellung');

    // Determine role
    const role = order.buyer_id === session.user.id
      ? 'buyer'
      : order.seller_id === session.user.id
      ? 'seller'
      : null;

    if (!role) return apiForbidden('Kein Zugriff auf diese Bestellung');

    // Validate status transition
    const currentStatus = order.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus]?.[role] || [];

    // Allow cancellation from pending_payment for either role
    if (currentStatus === 'pending_payment' && newStatus === 'cancelled') {
      // OK — allowed
    } else if (!allowedTransitions.includes(newStatus)) {
      return apiBadRequest(
        `Statuswechsel von "${ORDER_STATUS_CONFIG[currentStatus as OrderStatus]?.label || currentStatus}" ` +
        `zu "${ORDER_STATUS_CONFIG[newStatus as OrderStatus]?.label || newStatus}" ist nicht erlaubt`
      );
    }

    const stripe = getStripeClient();

    // Handle Stripe operations for specific transitions
    if (newStatus === 'completed' && order.stripe_payment_intent_id && stripe) {
      // Capture the held payment
      try {
        await stripe.paymentIntents.capture(order.stripe_payment_intent_id);
      } catch (stripeError) {
        logger.error('Failed to capture PaymentIntent', { stripeError, orderId });
        return apiError(stripeError, 'Zahlung konnte nicht abgeschlossen werden');
      }
    }

    if (newStatus === 'cancelled' && order.status !== 'pending_payment' && order.stripe_payment_intent_id && stripe) {
      // Cancel/refund the PaymentIntent
      try {
        await stripe.paymentIntents.cancel(order.stripe_payment_intent_id);
      } catch (stripeError) {
        logger.error('Failed to cancel PaymentIntent', { stripeError, orderId });
        return apiError(stripeError, 'Zahlung konnte nicht storniert werden');
      }
    }

    // Build update query
    const updates: string[] = [`status = $1`];
    const params: unknown[] = [newStatus];
    let paramIndex = 2;

    // Store tracking info in shipping_address JSONB
    if (tracking_number || tracking_url) {
      updates.push(`shipping_address = COALESCE(shipping_address, '{}') || $${paramIndex++}::jsonb`);
      params.push(JSON.stringify({
        ...(tracking_number && { tracking_number }),
        ...(tracking_url && { tracking_url }),
      }));
    }

    params.push(orderId);
    await query(
      `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS}
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}`,
      params
    );

    // If completed: update listing status to 'sold' and increment seller total_sold
    if (newStatus === 'completed') {
      await query(
        `UPDATE ${TABLE_NAMES.LISTINGS} SET status = 'sold' WHERE id = $1`,
        [order.listing_id]
      );
      await query(
        `UPDATE ${TABLE_NAMES.SELLER_PROFILES} SET total_sold = total_sold + 1 WHERE user_id = $1`,
        [order.seller_id]
      );
    }

    // If cancelled: restore listing to active
    if (newStatus === 'cancelled') {
      await query(
        `UPDATE ${TABLE_NAMES.LISTINGS} SET status = 'active' WHERE id = $1 AND status = 'reserved'`,
        [order.listing_id]
      );
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
    const counterpartyEmail = role === 'buyer' ? order.seller_email : order.buyer_email;
    const counterpartyName = role === 'buyer' ? order.seller_name : order.buyer_name;

    const actionHints: Record<string, string> = {
      shipped: 'Ihr Paket ist unterwegs. Bitte bestätigen Sie den Empfang.',
      delivered: 'Bitte überprüfen Sie den Artikel und bestätigen Sie den Empfang.',
      completed: 'Die Zahlung wurde freigegeben. Vielen Dank!',
      cancelled: 'Die Bestellung wurde storniert.',
    };

    if (counterpartyEmail && statusConfig) {
      sendCustomEmail(
        counterpartyEmail,
        orderStatusUpdate({
          recipientName: counterpartyName || 'Nutzer',
          listingTitle: order.listing_title,
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
