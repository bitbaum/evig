/**
 * POST /api/marketplace/orders — Create order + Payrexx reservation gateway
 * GET  /api/marketplace/orders — List my orders (buyer or seller)
 */

import { NextRequest } from 'next/server';
import { withAuth, ValidSession } from '@/lib/api/middleware';
import { apiSuccess, apiError, apiBadRequest, apiForbidden } from '@/lib/api/helpers';
import { db } from '@/db';
import { listings, listingImages, marketplaceOrders, marketplaceOrderItems, users } from '@/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { COMMISSION_RATE, LISTING_STATUS, ORDER_STATUS } from '@/config/marketplace';
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger';
import { validateBody, validateQuery, CreateOrderSchema, OrdersQuerySchema } from '@/lib/schemas';
import {
  PAYREXX_SETUP_MESSAGE,
  isPayrexxCheckoutUnavailable,
  createGateway,
} from '@/lib/payments/payrexx-client';
import { APP_URL } from '@/config/urls';
import { sendCustomEmail, orderConfirmationBuyer, newOrderNotificationSeller } from '@/lib/email';

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

    if (isPayrexxCheckoutUnavailable()) {
      return apiBadRequest(PAYREXX_SETUP_MESSAGE);
    }

    // All listing validation + order creation inside a single transaction
    // with FOR UPDATE lock to prevent TOCTOU race conditions
    const result = await db.transaction(async (tx) => {
      // Lock the listing row to prevent concurrent purchases
      const lockedRows = await tx.execute(
        sql`SELECT
              ${listings.id} AS id,
              ${listings.sellerId} AS seller_id,
              ${listings.title} AS title,
              ${listings.priceChf} AS price_chf,
              ${listings.paymentMode} AS payment_mode,
              ${listings.deliveryOptions} AS delivery_options,
              ${listings.shippingCostChf} AS shipping_cost_chf,
              ${listings.status} AS status,
              (${listings.isRevampit} = true OR lower(${users.email}) LIKE '%@revamp-it.ch' OR lower(${users.email}) LIKE '%@revampit.ch') AS is_revampit
            FROM ${listings}
            INNER JOIN ${users} ON ${users.id} = ${listings.sellerId}
            WHERE ${listings.id} = ${data.listing_id}
            FOR UPDATE`
      );

      const listing = lockedRows.rows[0] as {
        id: string; seller_id: string; title: string; price_chf: string;
        payment_mode: string; delivery_options: string; shipping_cost_chf: string | null;
        status: string; is_revampit: boolean;
      } | undefined;

      if (!listing) {
        throw new OrderValidationError('Inserat nicht gefunden');
      }

      if (listing.status !== LISTING_STATUS.ACTIVE) {
        throw new OrderValidationError('Inserat ist nicht mehr verfügbar');
      }

      // RevampIT items always support online payment — skip the direct-only check
      if (!listing.is_revampit && listing.payment_mode === 'direct') {
        throw new OrderValidationError('Dieses Inserat unterstützt keine sichere Zahlung');
      }

      if (listing.seller_id === session.user.id) {
        throw new OrderValidationError('Du kannst dein eigenes Inserat nicht kaufen', 403);
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

      // Calculate amounts — RevampIT items have no platform commission
      const priceChf = Number(listing.price_chf);
      const shippingChf = data.delivery_method === 'shipping' && listing.shipping_cost_chf
        ? Number(listing.shipping_cost_chf)
        : 0;
      const totalChf = priceChf + shippingChf;
      const commissionChf = listing.is_revampit
        ? 0
        : Math.round(totalChf * COMMISSION_RATE * 100) / 100;
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
        purpose: `${ORG.name}: ${listing.title}`,
        successRedirectUrl: `${APP_URL}/marketplace/checkout/success?orderId=${orderId}`,
        failedRedirectUrl: `${APP_URL}/marketplace/checkout/${listing.id}?error=payment_failed`,
        cancelRedirectUrl: `${APP_URL}/marketplace/checkout/${listing.id}?error=cancelled`,
      });
    } catch (gatewayError) {
      // Rollback: delete order + restore listing to ACTIVE atomically.
      // Promise.all would leave the listing stuck in RESERVED if the update fails
      // after the delete succeeds (and vice versa).
      logger.error('Payrexx gateway creation failed, rolling back order', {
        error: gatewayError, orderId, listingId: listing.id,
      });
      try {
        await db.transaction(async (tx) => {
          await tx.delete(marketplaceOrders).where(eq(marketplaceOrders.id, orderId));
          await tx.update(listings).set({ status: LISTING_STATUS.ACTIVE }).where(eq(listings.id, listing.id));
        });
      } catch (rollbackError) {
        logger.error('Order rollback failed — manual reconciliation required', {
          error: rollbackError, orderId, listingId: listing.id,
        });
      }
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

    // Send order notifications (fire-and-forget). The order detail page is
    // mounted at /dashboard/orders/[id]; there is no /marketplace/orders/[id]
    // route, so the prior URL shape 404'd on click for both buyer and seller.
    // Other order-route emails (confirm-receipt, review, [id] PATCH) already
    // use /dashboard/orders/<id>, so this aligns with the rest of the surface.
    const orderUrl = `${APP_URL}/dashboard/orders/${orderId}`;
    const deliveryLabel = data.delivery_method === 'shipping' ? 'Versand' : 'Abholung';

    // Notify buyer — user data comes from session (no extra RTT)
    if (session.user.email) {
      sendCustomEmail(session.user.email, orderConfirmationBuyer({
        recipientName: session.user.name || 'Käufer',
        listingTitle: listing.title,
        amountChf: `CHF ${totalChf.toFixed(2)}`,
        commissionChf: `CHF ${(Math.round(totalChf * COMMISSION_RATE * 100) / 100).toFixed(2)}`,
        deliveryMethod: deliveryLabel,
        orderUrl,
      })).catch(err => logger.error('Failed to send buyer order confirmation', { err, orderId }));
    }

    // Notify seller — fire-and-forget (seller lookup + email, non-blocking)
    const payoutChf = Math.round((totalChf - Math.round(totalChf * COMMISSION_RATE * 100) / 100) * 100) / 100;
    db.select({ email: users.email, name: users.name })
      .from(users)
      .where(eq(users.id, listing.seller_id))
      .limit(1)
      .then(([seller]) => {
        if (seller?.email) {
          sendCustomEmail(seller.email, newOrderNotificationSeller({
            recipientName: seller.name || 'Verkäufer',
            buyerName: session.user.name || 'Käufer',
            listingTitle: listing.title,
            payoutAmountChf: `CHF ${payoutChf.toFixed(2)}`,
            deliveryMethod: deliveryLabel,
            orderUrl,
          })).catch(err => logger.error('Failed to send seller order notification', { err, orderId }));
        }
      })
      .catch(err => logger.error('Failed to look up seller for order email', { err, orderId }));

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
        // Single-item orders carry listings.title; cart orders (listingId null)
        // have no listing row, so fall back to the first order-item's title.
        listingTitle: sql<string | null>`COALESCE(${listings.title}, (
          SELECT it.title FROM ${marketplaceOrderItems} it
          WHERE it.order_id = ${marketplaceOrders.id}
          ORDER BY it.created_at LIMIT 1
        ))`,
        // 0 for single-item orders, N for cart orders — lets the UI render
        // "Title +N weitere".
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
        counterpartyName: filters.role === 'seller'
          ? sql<string | null>`bu.name`
          : sql<string | null>`su.name`,
        counterpartyId: filters.role === 'seller'
          ? marketplaceOrders.buyerId
          : marketplaceOrders.sellerId,
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
