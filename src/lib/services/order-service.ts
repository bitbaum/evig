/**
 * Order Service
 *
 * Business logic for order creation.
 * Creates order records from local inventory items
 * and decrements inventory.
 */

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import { inventoryItems, aiExtractedProducts, orders, orderItems } from '@/db/schema'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'

// Table name refs
const iiTable = getTableName(inventoryItems)
const aepTable = getTableName(aiExtractedProducts)
const ordersTable = getTableName(orders)
const oiTable = getTableName(orderItems)

// ============================================================================
// Types
// ============================================================================

export interface ShippingAddress {
  firstName: string
  lastName: string
  street: string
  city: string
  postalCode: string
  country: string
}

export interface OrderItem {
  inventoryItemId: string
  quantity: number
}

export interface CreateOrderParams {
  userId: string
  items: OrderItem[]
  paymentTransactionId?: string
  shippingAddress?: ShippingAddress
}

interface OrderRow {
  id: string
  created_at: string
}

export interface CreatedOrder {
  orderId: string
  createdAt: string
}

interface InventoryRow {
  id: string
  selling_price_chf: number | null
  quantity_available: number
  product_name: string
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a new order from local inventory items.
 *
 * Looks up inventory items, creates order + order items
 * with real totals, and decrements quantity_available.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
  const { userId, items, paymentTransactionId = PAYMENT_STATUS.PENDING, shippingAddress } = params

  try {
    if (!items || items.length === 0) {
      throw new Error('Warenkorb ist leer')
    }

    const itemIds = items.map(i => i.inventoryItemId)

    // Lock inventory rows, validate stock, calculate total, create order +
    // items, decrement — all inside one transaction. Without the FOR UPDATE
    // lock, two concurrent orders for the same last-N items both pass the
    // stock check and oversell (GREATEST(...,0) hides the bug but the orders
    // still exist with no inventory to fulfill them).
    const result = await db.transaction(async (tx) => {
      const inventoryResult = await tx.execute(sql`
        SELECT ii.id, ii.selling_price_chf, ii.quantity_available, aep.product_name
        FROM ${sql.raw(iiTable)} ii
        JOIN ${sql.raw(aepTable)} aep ON aep.id = ii.ai_product_id
        WHERE ii.id IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})
        FOR UPDATE OF ii
      `)

      const inventoryMap = new Map(
        (inventoryResult.rows as unknown as InventoryRow[]).map(r => [r.id, r])
      )

      let totalCents = 0
      for (const item of items) {
        const inv = inventoryMap.get(item.inventoryItemId)
        if (!inv) {
          throw new Error(`Artikel nicht gefunden: ${item.inventoryItemId}`)
        }
        if (inv.quantity_available < item.quantity) {
          throw new Error(`Nicht genügend Lagerbestand für: ${inv.product_name}`)
        }
        totalCents += (inv.selling_price_chf || 0) * 100 * item.quantity
      }

      const orderResult = await tx.execute(sql`
        INSERT INTO ${sql.raw(ordersTable)} (
          user_id,
          status,
          total_amount_cents,
          currency,
          payment_intent_id,
          shipping_address
        ) VALUES (
          ${userId},
          'confirmed',
          ${totalCents},
          'CHF',
          ${paymentTransactionId},
          ${shippingAddress ? JSON.stringify(shippingAddress) : null}
        )
        RETURNING id, created_at
      `)

      const orderData = (orderResult.rows as unknown as OrderRow[])[0]
      const orderId = orderData.id

      // Create order items and decrement inventory
      for (const item of items) {
        const inv = inventoryMap.get(item.inventoryItemId)!

        await tx.execute(sql`
          INSERT INTO ${sql.raw(oiTable)} (
            order_id,
            product_title,
            quantity,
            unit_price_cents,
            total_price_cents,
            inventory_item_id
          ) VALUES (
            ${orderId},
            ${inv.product_name},
            ${item.quantity},
            ${(inv.selling_price_chf || 0) * 100},
            ${(inv.selling_price_chf || 0) * 100 * item.quantity},
            ${item.inventoryItemId}
          )
        `)

        // Row is locked + stock validated above; safe to decrement without clamp
        await tx.execute(sql`
          UPDATE ${sql.raw(iiTable)}
          SET quantity_available = quantity_available - ${item.quantity}
          WHERE id = ${item.inventoryItemId}
        `)
      }

      return { orderId, createdAt: orderData.created_at, totalCents }
    })

    logger.info('Order created', {
      orderId: result.orderId,
      userId,
      totalCents: result.totalCents,
      itemCount: items.length,
    })

    return { orderId: result.orderId, createdAt: result.createdAt }
  } catch (error) {
    logger.error('Failed to create order', {
      userId,
      itemCount: items.length,
      error,
    })
    throw error
  }
}
