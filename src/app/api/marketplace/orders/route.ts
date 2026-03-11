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

// ============================================================================
// POST — Create order + Payrexx Gateway
// ============================================================================

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  try {
    const body = await request.json();
    const validation = validateBody(CreateOrderSchema, body);
    if (!validation.success) return validation.error;
    const data = validation.data;

    // Fetch listing
    const [listing] = await db
      .select({
        id: listings.id,
        sellerId: listings.sellerId,
        title: listings.title,
        priceChf: listings.priceChf,
        paymentMode: listings.paymentMode,
        deliveryOptions: listings.deliveryOptions,
        shippingCostChf: listings.shippingCostChf,
        status: listings.status,
      })
      .from(listings)
      .where(eq(listings.id, data.listing_id));

    if (!listing) {
      return apiBadRequest('Inserat nicht gefunden');
    }

    if (listing.status !== LISTING_STATUS.ACTIVE) {
      return apiBadRequest('Inserat ist nicht mehr verfügbar');
    }

    // Must allow secure payment
    if (listing.paymentMode === 'direct') {
      return apiBadRequest('Dieses Inserat unterstützt keine sichere Zahlung');
    }

    // Can't buy your own listing
    if (listing.sellerId === session.user.id) {
      return apiForbidden('Sie können Ihr eigenes Inserat nicht kaufen');
    }

    // Validate delivery method against listing options
    if (data.delivery_method === 'shipping' && listing.deliveryOptions === 'pickup') {
      return apiBadRequest('Versand ist für dieses Inserat nicht verfügbar');
    }
    if (data.delivery_method === 'pickup' && listing.deliveryOptions === 'shipping') {
      return apiBadRequest('Abholung ist für dieses Inserat nicht verfügbar');
    }

    // Require shipping address for shipping delivery
    if (data.delivery_method === 'shipping' && !data.shipping_address) {
      return apiBadRequest('Lieferadresse ist für Versand erforderlich');
    }

    // Calculate amounts
    const priceChf = Number(listing.priceChf);
    const shippingChf = data.delivery_method === 'shipping' && listing.shippingCostChf
      ? Number(listing.shippingCostChf)
      : 0;
    const totalChf = priceChf + shippingChf;
    const commissionChf = Math.round(totalChf * COMMISSION_RATE * 100) / 100;
    const payoutChf = Math.round((totalChf - commissionChf) * 100) / 100;

    const orderId = await db.transaction(async (tx) => {
      // Insert order
      const [newOrder] = await tx
        .insert(marketplaceOrders)
        .values({
          buyerId: session.user.id,
          sellerId: listing.sellerId,
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

      const newOrderId = newOrder.id;

      // Reserve listing
      await tx
        .update(listings)
        .set({ status: LISTING_STATUS.RESERVED })
        .where(and(
          eq(listings.id, listing.id),
          eq(listings.status, LISTING_STATUS.ACTIVE),
        ));

      return newOrderId;
    });

    // Create Payrexx Gateway (reservation mode)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const gateway = await createGateway({
      amount: Math.round(totalChf * 100), // CHF Rappen
      currency: 'CHF',
      referenceId: orderId,
      purpose: `RevampIT: ${listing.title}`,
      successRedirectUrl: `${baseUrl}/marketplace/checkout/success?orderId=${orderId}`,
      failedRedirectUrl: `${baseUrl}/marketplace/checkout/${listing.id}?error=payment_failed`,
      cancelRedirectUrl: `${baseUrl}/marketplace/checkout/${listing.id}?error=cancelled`,
    });

    // Store gateway ID on order
    await db
      .update(marketplaceOrders)
      .set({ payrexxGatewayId: String(gateway.id) })
      .where(eq(marketplaceOrders.id, orderId));

    logger.info('Marketplace order created', {
      orderId,
      listingId: listing.id,
      buyerId: session.user.id,
      sellerId: listing.sellerId,
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
