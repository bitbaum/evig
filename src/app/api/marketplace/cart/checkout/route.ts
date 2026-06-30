/**
 * POST /api/marketplace/cart/checkout
 *
 * Multi-item checkout for the RevampIT shop cart. Creates ONE marketplace order
 * (seller = the Revamp-IT org account, 0 commission) with N
 * marketplace_order_items, reserves every listing, and opens a single Payrexx
 * gateway for the total. Only is_revampit listings are accepted — community P2P
 * listings use the single-item /api/marketplace/orders flow.
 */
import { NextRequest } from 'next/server'
import { withAuth, ValidSession } from '@/lib/api/middleware'
import { apiSuccess, apiError, apiBadRequest } from '@/lib/api/helpers'
import { db } from '@/db'
import { listings, marketplaceOrders, marketplaceOrderItems } from '@/db/schema'
import { eq, inArray, sql } from 'drizzle-orm'
import { LISTING_STATUS, ORDER_STATUS, REVAMPIT_LISTING_DELIVERY } from '@/config/marketplace'
import { ORG } from '@/config/org'
import { logger } from '@/lib/logger'
import { PAYREXX_SETUP_MESSAGE, isPayrexxCheckoutUnavailable, createGateway } from '@/lib/payments/payrexx-client'
import { APP_URL } from '@/config/urls'
import { getRevampitSellerId } from '@/lib/marketplace/publish-revampit-listing'
import { z } from 'zod'

const CartCheckoutSchema = z.object({
  listing_ids: z.array(z.string().uuid()).min(1).max(50),
  delivery_method: z.enum(['pickup', 'shipping']).default('pickup'),
  shipping_address: z.object({
    name: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    postal_code: z.string().regex(/^\d{4}$/),
    country: z.string().default('CH'),
  }).optional().nullable(),
})

class CartError extends Error {}

interface LockedRow {
  id: string
  seller_id: string
  title: string
  price_chf: string
  status: string
  is_revampit: boolean
}

export const POST = withAuth(async (request: NextRequest, session: ValidSession) => {
  let ids: string[] = []
  try {
    const body = await request.json().catch(() => ({}))
    const parsed = CartCheckoutSchema.safeParse(body)
    if (!parsed.success) return apiBadRequest('Ungültiger Warenkorb')
    ids = [...new Set(parsed.data.listing_ids)]
    const deliveryMethod = parsed.data.delivery_method
    if (deliveryMethod === 'shipping' && !parsed.data.shipping_address) {
      return apiBadRequest('Lieferadresse erforderlich')
    }

    if (isPayrexxCheckoutUnavailable()) return apiBadRequest(PAYREXX_SETUP_MESSAGE)

    const sellerId = await getRevampitSellerId(db)

    const result = await db.transaction(async (tx) => {
      // Lock every listing row to prevent concurrent purchase.
      const locked = await tx.execute(sql`
        SELECT ${listings.id} AS id, ${listings.sellerId} AS seller_id, ${listings.title} AS title,
               ${listings.priceChf} AS price_chf, ${listings.status} AS status, ${listings.isRevampit} AS is_revampit
        FROM ${listings}
        WHERE ${listings.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
        FOR UPDATE
      `)
      const rows = locked.rows as unknown as LockedRow[]

      if (rows.length !== ids.length) throw new CartError('Ein Artikel im Warenkorb ist nicht mehr verfügbar')
      for (const r of rows) {
        if (r.status !== LISTING_STATUS.ACTIVE) throw new CartError(`«${r.title}» ist nicht mehr verfügbar`)
        if (!r.is_revampit) throw new CartError('Nur Revamp-IT-Geräte können über den Warenkorb gekauft werden')
        if (r.seller_id === session.user.id) throw new CartError('Du kannst dein eigenes Inserat nicht kaufen')
      }

      const itemsTotalChf = Math.round(rows.reduce((s, r) => s + Number(r.price_chf), 0) * 100) / 100
      const shippingChf = deliveryMethod === 'shipping' && REVAMPIT_LISTING_DELIVERY.shippingCostChf
        ? Number(REVAMPIT_LISTING_DELIVERY.shippingCostChf)
        : 0
      const totalChf = Math.round((itemsTotalChf + shippingChf) * 100) / 100

      const [order] = await tx
        .insert(marketplaceOrders)
        .values({
          buyerId: session.user.id,
          sellerId,
          listingId: null,
          amountChf: String(totalChf),
          commissionChf: '0',
          sellerPayoutChf: String(totalChf),
          status: ORDER_STATUS.PENDING_PAYMENT,
          deliveryMethod,
          shippingAddress: deliveryMethod === 'shipping' ? parsed.data.shipping_address : null,
          paymentProvider: 'payrexx',
        })
        .returning({ id: marketplaceOrders.id })

      await tx.insert(marketplaceOrderItems).values(
        rows.map((r) => ({
          orderId: order.id,
          listingId: r.id,
          title: r.title,
          unitPriceChf: r.price_chf,
          quantity: 1,
        })),
      )

      await tx.update(listings).set({ status: LISTING_STATUS.RESERVED }).where(inArray(listings.id, ids))

      return { orderId: order.id, totalChf, itemCount: rows.length }
    })

    const { orderId, totalChf, itemCount } = result

    let gateway: { id: number; link: string }
    try {
      gateway = await createGateway({
        amount: Math.round(totalChf * 100), // CHF Rappen
        currency: 'CHF',
        referenceId: orderId,
        purpose: `${ORG.name}: ${itemCount} Artikel`,
        successRedirectUrl: `${APP_URL}/marketplace/checkout/success?orderId=${orderId}`,
        failedRedirectUrl: `${APP_URL}/marketplace/cart?error=payment_failed`,
        cancelRedirectUrl: `${APP_URL}/marketplace/cart?error=payment_cancelled`,
      })
    } catch (gatewayError) {
      // Rollback: delete order (items cascade) + restore listings to ACTIVE.
      try {
        await db.transaction(async (tx) => {
          await tx.delete(marketplaceOrders).where(eq(marketplaceOrders.id, orderId))
          await tx.update(listings).set({ status: LISTING_STATUS.ACTIVE }).where(inArray(listings.id, ids))
        })
      } catch (rollbackError) {
        logger.error('Cart order rollback failed — manual reconciliation required', { rollbackError, orderId })
      }
      return apiError(gatewayError, 'Zahlungsgateway konnte nicht erstellt werden. Bitte versuche es erneut.')
    }

    await db.update(marketplaceOrders).set({ payrexxGatewayId: String(gateway.id) }).where(eq(marketplaceOrders.id, orderId))

    logger.info('Cart order created', { orderId, itemCount, totalChf, buyerId: session.user.id })
    return apiSuccess({ orderId, paymentUrl: gateway.link }, 201)
  } catch (error) {
    if (error instanceof CartError) return apiBadRequest(error.message)
    return apiError(error, 'Fehler beim Erstellen der Bestellung')
  }
})
