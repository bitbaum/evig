import { db } from '@/db'
import { marketplaceOrders, marketplaceOrderItems, listings, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { withAdmin } from '@/lib/api/middleware'
import { apiError, apiSuccess , hasMoreItems} from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { validateQuery, AdminOrdersQuerySchema } from '@/lib/schemas'

const buyer = alias(users, 'buyer')
const sellerUser = alias(users, 'seller')

// GET /api/admin/marketplace/orders - List all orders
export const GET = withAdmin('marketplace', async (request) => {
  try {
    const { searchParams } = new URL(request.url)
    const validation = validateQuery(AdminOrdersQuerySchema, Object.fromEntries(searchParams))
    if (!validation.success) return validation.error

    const { status, limit, offset } = validation.data

    const conditions: SQL[] = []
    if (status !== 'all') {
      conditions.push(eq(marketplaceOrders.status, status))
    }

    const where = conditions.length > 0 ? conditions[0] : undefined

    // Count total
    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(marketplaceOrders)
      .where(where)

    const total = Number(countRow?.count ?? 0)

    // Fetch orders with joins
    const rows = await db
      .select({
        id: marketplaceOrders.id,
        status: marketplaceOrders.status,
        total_cents: sql<number>`(${marketplaceOrders.amountChf} * 100)::int`,
        delivery_method: marketplaceOrders.deliveryMethod,
        shipping_address: marketplaceOrders.shippingAddress,
        tracking_number: marketplaceOrders.trackingNumber,
        created_at: marketplaceOrders.createdAt,
        updated_at: marketplaceOrders.updatedAt,
        listing_id: listings.id,
        listing_title: listings.title,
        // Cart orders have no single listingId — count their order_items so the
        // UI can label them "N Artikel" instead of rendering a blank row.
        item_count: sql<number>`(select count(*)::int from ${marketplaceOrderItems} where ${marketplaceOrderItems.orderId} = ${marketplaceOrders.id})`,
        buyer_name: buyer.name,
        buyer_email: buyer.email,
        seller_name: sellerUser.name,
        seller_email: sellerUser.email,
      })
      .from(marketplaceOrders)
      // LEFT join — cart (multi-item) orders carry a null listingId; an inner
      // join silently dropped every RevampIT shop cart order from this view.
      .leftJoin(listings, eq(marketplaceOrders.listingId, listings.id))
      .innerJoin(buyer, eq(marketplaceOrders.buyerId, buyer.id))
      // Seller is taken from the order itself (NOT NULL), so it resolves for
      // both single-item and cart orders.
      .innerJoin(sellerUser, eq(marketplaceOrders.sellerId, sellerUser.id))
      .where(where)
      .orderBy(desc(marketplaceOrders.createdAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess({
      items: rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: hasMoreItems(offset, limit, total),
      },
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
})
