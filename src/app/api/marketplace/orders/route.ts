/**
 * POST /api/marketplace/orders — Create order + Stripe PaymentIntent
 * GET  /api/marketplace/orders — List my orders (buyer or seller)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from '@/lib/api/helpers';
import { query, transaction } from '@/lib/auth/db';
import { TABLE_NAMES } from '@/config/database';
import { MARKETPLACE_LIMITS } from '@/config/marketplace';
import { DELIVERY_LABELS } from '@/config/marketplace';
import type { DeliveryOption } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, validateQuery, CreateOrderSchema, OrdersQuerySchema } from '@/lib/schemas';
import { getStripeClient } from '@/lib/payments/stripe-client';
import { sendCustomEmail } from '@/lib/email';
import {
  orderConfirmationBuyer,
  newOrderNotificationSeller,
} from '@/lib/email/templates/marketplace';
import { formatCHF } from '@/config/marketplace';

// ============================================================================
// POST — Create order + PaymentIntent
// ============================================================================

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const validation = validateBody(CreateOrderSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Fetch listing
    const listingResult = await query<{
      id: string;
      seller_id: string;
      title: string;
      price_chf: number;
      payment_mode: string;
      delivery_options: string;
      shipping_cost_chf: number | null;
      status: string;
    }>(
      `SELECT id, seller_id, title, price_chf, payment_mode, delivery_options, shipping_cost_chf, status
       FROM ${TABLE_NAMES.LISTINGS} WHERE id = $1`,
      [data.listing_id]
    );

    const listing = listingResult.rows[0];
    if (!listing) {
      return apiBadRequest('Inserat nicht gefunden');
    }

    if (listing.status !== 'active') {
      return apiBadRequest('Inserat ist nicht mehr verfügbar');
    }

    // Must allow secure payment
    if (listing.payment_mode === 'direct') {
      return apiBadRequest('Dieses Inserat unterstützt keine sichere Zahlung');
    }

    // Can't buy your own listing
    if (listing.seller_id === session.user.id) {
      return apiForbidden('Sie können Ihr eigenes Inserat nicht kaufen');
    }

    // Validate delivery method against listing options
    if (data.delivery_method === 'shipping' && listing.delivery_options === 'pickup') {
      return apiBadRequest('Versand ist für dieses Inserat nicht verfügbar');
    }
    if (data.delivery_method === 'pickup' && listing.delivery_options === 'shipping') {
      return apiBadRequest('Abholung ist für dieses Inserat nicht verfügbar');
    }

    // Require shipping address for shipping delivery
    if (data.delivery_method === 'shipping' && !data.shipping_address) {
      return apiBadRequest('Lieferadresse ist für Versand erforderlich');
    }

    // Calculate amounts
    const priceChf = Number(listing.price_chf);
    const shippingChf = data.delivery_method === 'shipping' && listing.shipping_cost_chf
      ? Number(listing.shipping_cost_chf)
      : 0;
    const totalChf = priceChf + shippingChf;
    const commissionChf = Math.round(totalChf * MARKETPLACE_LIMITS.COMMISSION_RATE * 100) / 100;
    const payoutChf = Math.round((totalChf - commissionChf) * 100) / 100;

    // Create Stripe PaymentIntent
    const stripe = getStripeClient();
    if (!stripe) {
      return apiError(null, 'Zahlungssystem ist nicht konfiguriert', 503);
    }

    const orderId = await transaction(async (client) => {
      // Insert order
      const orderResult = await client.query(
        `INSERT INTO ${TABLE_NAMES.MARKETPLACE_ORDERS} (
          buyer_id, seller_id, listing_id,
          amount_chf, commission_chf, seller_payout_chf,
          status, delivery_method, shipping_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id`,
        [
          session.user.id,
          listing.seller_id,
          listing.id,
          totalChf,
          commissionChf,
          payoutChf,
          'pending_payment',
          data.delivery_method,
          data.shipping_address ? JSON.stringify(data.shipping_address) : null,
        ]
      );

      const newOrderId = orderResult.rows[0].id;

      // Reserve listing
      await client.query(
        `UPDATE ${TABLE_NAMES.LISTINGS} SET status = 'reserved' WHERE id = $1 AND status = 'active'`,
        [listing.id]
      );

      return newOrderId;
    });

    // Create Stripe PaymentIntent (manual capture for escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalChf * 100), // CHF cents
      currency: 'chf',
      capture_method: 'manual',
      metadata: {
        marketplaceOrderId: orderId,
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.seller_id,
      },
    });

    // Store PaymentIntent ID on order
    await query(
      `UPDATE ${TABLE_NAMES.MARKETPLACE_ORDERS} SET stripe_payment_intent_id = $1 WHERE id = $2`,
      [paymentIntent.id, orderId]
    );

    logger.info('Marketplace order created', {
      orderId,
      listingId: listing.id,
      buyerId: session.user.id,
      sellerId: listing.seller_id,
      amountChf: totalChf,
    });

    // Fire-and-forget: email notifications
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const orderUrl = `${baseUrl}/dashboard/orders/${orderId}`;
    const deliveryLabel = DELIVERY_LABELS[data.delivery_method as DeliveryOption] || data.delivery_method;

    if (session.user.email) {
      sendCustomEmail(
        session.user.email,
        orderConfirmationBuyer({
          recipientName: session.user.name || 'Käufer',
          listingTitle: listing.title,
          amountChf: formatCHF(totalChf),
          commissionChf: formatCHF(commissionChf),
          deliveryMethod: deliveryLabel,
          orderUrl,
        })
      ).catch(err => logger.error('Failed to send buyer order confirmation', { error: err, orderId }));
    }

    // Fetch seller email for notification
    query<{ email: string; name: string | null }>(
      `SELECT email, name FROM ${TABLE_NAMES.USERS} WHERE id = $1`,
      [listing.seller_id]
    ).then(result => {
      const seller = result.rows[0];
      if (seller?.email) {
        sendCustomEmail(
          seller.email,
          newOrderNotificationSeller({
            recipientName: seller.name || 'Verkäufer',
            buyerName: session.user.name || 'Käufer',
            listingTitle: listing.title,
            payoutAmountChf: formatCHF(payoutChf),
            deliveryMethod: deliveryLabel,
            orderUrl: `${baseUrl}/dashboard/orders/${orderId}`,
          })
        ).catch(err => logger.error('Failed to send seller order notification', { error: err, orderId }));
      }
    }).catch(err => logger.error('Failed to fetch seller for order notification', { error: err, orderId }));

    return apiSuccess({
      orderId,
      clientSecret: paymentIntent.client_secret,
    }, 201);
  } catch (error) {
    return apiError(error, 'Fehler beim Erstellen der Bestellung');
  }
});

// ============================================================================
// GET — List my orders
// ============================================================================

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | null> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    const validation = validateQuery(OrdersQuerySchema, rawParams);
    if (!validation.success) return validation.error;
    const filters = validation.data;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Role determines perspective
    if (filters.role === 'seller') {
      conditions.push(`o.seller_id = $${paramIndex++}`);
    } else {
      conditions.push(`o.buyer_id = $${paramIndex++}`);
    }
    params.push(session.user.id);

    if (filters.status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    const whereClause = conditions.join(' AND ');

    // Count total
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    // Fetch orders with listing + counterparty info
    const ordersResult = await query(
      `SELECT
        o.id, o.listing_id, o.amount_chf, o.commission_chf, o.seller_payout_chf,
        o.status, o.delivery_method, o.shipping_address, o.created_at, o.updated_at,
        l.title as listing_title,
        (SELECT li.url FROM ${TABLE_NAMES.LISTING_IMAGES} li WHERE li.listing_id = l.id AND li.is_primary = true LIMIT 1) as thumbnail,
        CASE WHEN $${paramIndex} = 'seller' THEN bu.name ELSE su.name END as counterparty_name,
        CASE WHEN $${paramIndex} = 'seller' THEN o.buyer_id ELSE o.seller_id END as counterparty_id
      FROM ${TABLE_NAMES.MARKETPLACE_ORDERS} o
      JOIN ${TABLE_NAMES.LISTINGS} l ON o.listing_id = l.id
      JOIN ${TABLE_NAMES.USERS} bu ON o.buyer_id = bu.id
      JOIN ${TABLE_NAMES.USERS} su ON o.seller_id = su.id
      WHERE ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
      [...params, filters.role, filters.limit, filters.offset]
    );

    return apiSuccess({
      items: ordersResult.rows,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
      },
    });
  } catch (error) {
    return apiError(error, 'Fehler beim Laden der Bestellungen');
  }
});
