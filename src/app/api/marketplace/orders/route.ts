/**
 * POST /api/marketplace/orders — Create order + Payrexx reservation gateway
 * GET  /api/marketplace/orders — List my orders (buyer or seller)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages, marketplaceOrders, users } from '@/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { COMMISSION_RATE, LISTING_STATUS, ORDER_STATUS } from '@/config/marketplace';
import { logger } from '@/lib/logger';
import { validateBody, validateQuery, CreateOrderSchema, OrdersQuerySchema } from '@/lib/schemas';
import { createGateway } from '@/lib/payments/payrexx-client';
import { APP_URL } from '@/config/urls';

class OrderValidationError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ============================================================================
// POST — Create order + Payrexx Gateway
// ============================================================================

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const validation = validateBody(CreateOrderSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // All listing validation + order creation inside a single transaction
    // with FOR UPDATE lock to prevent TOCTOU race conditions
    const result = await db.transaction(async (tx) => {
      // Lock the listing row to prevent concurrent purchases
      const lockedRows = await tx.execute(
        sql`SELECT id, seller_id, title, price_chf, payment_mode, delivery_options, shipping_cost_chf, status
            FROM ${listings}
            WHERE id = ${data.listing_id}
            FOR UPDATE`
      );

      const listing = lockedRows.rows[0] as {
        id: string; seller_id: string; title: string; price_chf: string;
        payment_mode: string; delivery_options: string; shipping_cost_chf: string | null; status: string;
      } | undefined;

      if (!listing) {
        throw new OrderValidationError('Inserat nicht gefunden');
      }

      if (listing.status !== LISTING_STATUS.ACTIVE) {
        throw new OrderValidationError('Inserat ist nicht mehr verfügbar');
      }

      if (listing.payment_mode === 'direct') {
        throw new OrderValidationError('Dieses Inserat unterstützt keine sichere Zahlung');
      }

      if (listing.seller_id === session.user.id) {
        throw new OrderValidationError('Sie können Ihr eigenes Inserat nicht kaufen', 403);
      }

      if (data.delivery_method === 'shipping' && listing.delivery_options === 'pickup') {
        throw new OrderValidationError('Versand ist für dieses Inserat nicht verfügbar');
      }
      if (data.delivery_method === 'pickup' && listing.delivery_options === 'shipping') {
        throw new OrderValidationError('Abholung ist für dieses Inserat nicht verfügbar');
      }

      if (data.delivery_method === 'shipping' && !data.shipping_address) {
        throw new OrderValidationError('Lieferadresse ist für Versand erforderlich');
      }

      // Calculate amounts
      const priceChf = Number(listing.price_chf);
      const shippingChf = data.delivery_method === 'shipping' && listing.shipping_cost_chf
        ? Number(listing.shipping_cost_chf)
        : 0;
      const totalChf = priceChf + shippingChf;
      const commissionChf = Math.round(totalChf * COMMISSION_RATE * 100) / 100;
      const payoutChf = Math.round((totalChf - commissionChf) * 100) / 100;

      // Insert order
      const [newOrder] = await tx
        .insert(marketplaceOrders)
        .values({
          buyerId: session.user.id,
          sellerId: listing.seller_id,
          listingId: listing.id,
          amountChf: String(totalChf),
          commissionChf: String(commissionChf),
          sellerPayoutChf: String(payoutChf),
          status: ORDER_STATUS.PENDING_PAYMENT,
          deliveryMethod: data.delivery_method,
          shippingAddress: data.shipping_address ? data.shipping_address : null,
          paymentProvider: 'payrexx',
        })
        .returning({ id: marketplaceOrders.id });

      // Reserve listing (already locked, guaranteed still ACTIVE)
      await tx
        .update(listings)
        .set({ status: LISTING_STATUS.RESERVED })
        .where(eq(listings.id, listing.id));

      return {
        orderId: newOrder.id,
        listing: { id: listing.id, title: listing.title, seller_id: listing.seller_id },
        totalChf,
      };
    });

    const { orderId, listing, totalChf } = result;

    // Create Payrexx Gateway (reservation mode) — rollback on failure
    let gateway: { id: number; link: string };
    try {
      gateway = await createGateway({
        amount: Math.round(totalChf * 100), // CHF Rappen
        currency: 'CHF',
        referenceId: orderId,
        purpose: `RevampIT: ${listing.title}`,
        successRedirectUrl: `${APP_URL}/marketplace/checkout/success?orderId=${orderId}`,
        failedRedirectUrl: `${APP_URL}/marketplace/checkout/${listing.id}?error=payment_failed`,
        cancelRedirectUrl: `${APP_URL}/marketplace/checkout/${listing.id}?error=cancelled`,
      });
    } catch (gatewayError) {
      // Rollback: delete order and restore listing to ACTIVE
      logger.error('Payrexx gateway creation failed, rolling back order', {
        error: gatewayError, orderId, listingId: listing.id,
      });
      await db.delete(marketplaceOrders).where(eq(marketplaceOrders.id, orderId));
      await db.update(listings)
        .set({ status: LISTING_STATUS.ACTIVE })
        .where(eq(listings.id, listing.id));
      return apiError(gatewayError, 'Zahlungsgateway konnte nicht erstellt werden. Bitte versuche es erneut.');
    }

    // Store gateway ID on order
    await db
      .update(marketplaceOrders)
      .set({ payrexxGatewayId: String(gateway.id) })
      .where(eq(marketplaceOrders.id, orderId));

    logger.info('Marketplace order created', {
      orderId,
      listingId: listing.id,
      buyerId: session.user.id,
      sellerId: listing.seller_id,
      amountChf: totalChf,
      payrexxGatewayId: gateway.id,
    });

    // Email notifications are now sent by the webhook handler after payment
    // is confirmed (reserved status), since payment is asynchronous.

    return apiSuccess({
      orderId,
      paymentUrl: gateway.link,
    }, 201);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return error.statusCode === 403
        ? apiForbidden(error.message)
        : apiBadRequest(error.message);
    }
    return apiError(error, 'Fehler beim Erstellen der Bestellung');
  }
});

// ============================================================================
// GET — List my orders
// ============================================================================

// Aliased user tables for buyer/seller joins
const buyerUser = users;
const sellerUser = users;

export const GET = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams: Record<string, string | null> = {};
    searchParams.forEach((value, key) => { rawParams[key] = value; });

    const validation = validateQuery(OrdersQuerySchema, rawParams);
    if (!validation.success) return validation.error;
    const filters = validation.data;

    // Build where conditions
    const conditions = [];

    // Role determines perspective
    if (filters.role === 'seller') {
      conditions.push(eq(marketplaceOrders.sellerId, session.user.id));
    } else {
      conditions.push(eq(marketplaceOrders.buyerId, session.user.id));
    }

    if (filters.status) {
      conditions.push(eq(marketplaceOrders.status, filters.status));
    }

    const whereCondition = and(...conditions);

    // Count total
    const [countRow] = await db
      .select({ total: count() })
      .from(marketplaceOrders)
      .where(whereCondition);

    const total = Number(countRow?.total ?? 0);

    // Fetch orders with listing + counterparty info
    // Use raw SQL for the complex CASE expressions and subquery
    const ordersResult = await db
      .select({
        id: marketplaceOrders.id,
        listingId: marketplaceOrders.listingId,
        amountChf: marketplaceOrders.amountChf,
        commissionChf: marketplaceOrders.commissionChf,
        sellerPayoutChf: marketplaceOrders.sellerPayoutChf,
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
        counterpartyName: filters.role === 'seller'
          ? sql<string | null>`bu.name`
          : sql<string | null>`su.name`,
        counterpartyId: filters.role === 'seller'
          ? marketplaceOrders.buyerId
          : marketplaceOrders.sellerId,
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
      .where(whereCondition)
      .orderBy(desc(marketplaceOrders.createdAt))
      .limit(filters.limit)
      .offset(filters.offset);

    return apiSuccess({
      items: ordersResult,
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
