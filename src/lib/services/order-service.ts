/**
 * Order Service
 *
 * Business logic for order creation.
 * Creates order records from local inventory items
 * and decrements inventory.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { logger } from '@/lib/logger'

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

    // Look up inventory items
    const itemIds = items.map(i => i.inventoryItemId)
    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(', ')

    const inventoryResult = await query<InventoryRow>(
      `SELECT ii.id, ii.selling_price_chf, ii.quantity_available, aep.product_name
       FROM ${TABLE_NAMES.INVENTORY_ITEMS} ii
       JOIN ${TABLE_NAMES.AI_EXTRACTED_PRODUCTS} aep ON aep.id = ii.ai_product_id
       WHERE ii.id IN (${placeholders})`,
      itemIds,
    )

    const inventoryMap = new Map(inventoryResult.rows.map(r => [r.id, r]))

    // Calculate total
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

    // Create order record
    const orderResult = await query<OrderRow>(
      `INSERT INTO ${TABLE_NAMES.ORDERS} (
        user_id,
        status,
        total_amount_cents,
        currency,
        payment_intent_id,
        shipping_address
      ) VALUES ($1, 'confirmed', $2, 'CHF', $3, $4)
      RETURNING id, created_at`,
      [
        userId,
        totalCents,
        paymentTransactionId,
        shippingAddress ? JSON.stringify(shippingAddress) : null,
      ],
    )

    const orderData = orderResult.rows[0]
    const orderId = orderData.id

    // Create order items and decrement inventory
    for (const item of items) {
      const inv = inventoryMap.get(item.inventoryItemId)!

      await query(
        `INSERT INTO ${TABLE_NAMES.ORDER_ITEMS} (
          order_id,
          product_title,
          quantity,
          unit_price_cents,
          total_price_cents,
          inventory_item_id
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          inv.product_name,
          item.quantity,
          (inv.selling_price_chf || 0) * 100,
          (inv.selling_price_chf || 0) * 100 * item.quantity,
          item.inventoryItemId,
        ],
      )

      // Decrement inventory
      await query(
        `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
         SET quantity_available = GREATEST(quantity_available - $1, 0)
         WHERE id = $2`,
        [item.quantity, item.inventoryItemId],
      )
    }

    logger.info('Order created', {
      orderId,
      userId,
      totalCents,
      itemCount: items.length,
    })

    return {
      orderId,
      createdAt: orderData.created_at,
    }
  } catch (error) {
    logger.error('Failed to create order', {
      userId,
      itemCount: items.length,
      error,
    })
    throw error
  }
}
