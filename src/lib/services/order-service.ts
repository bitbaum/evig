/**
 * Order Service
 *
 * Business logic for order creation.
 * Handles inserting order records and order items into the database.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
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

export interface CreateOrderParams {
  userId: string
  cartId: string
  paymentIntentId: string
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

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a new order from a completed payment.
 *
 * TODO: Integrate with MedusaJS to pull real cart items and totals.
 * Currently uses placeholder values for the order total and items.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
  try {
    // Create order record
    const orderResult = await query<OrderRow>(
      `INSERT INTO ${TABLE_NAMES.ORDERS} (
        user_id,
        status,
        total_amount_cents,
        currency,
        payment_intent_id,
        shipping_address
      ) VALUES (
        $1,
        'completed',
        $2,
        'CHF',
        $3,
        $4
      )
      RETURNING id, created_at`,
      [
        params.userId,
        97092, // TODO: Pull from cart total
        params.paymentIntentId,
        params.shippingAddress ? JSON.stringify(params.shippingAddress) : null,
      ]
    )

    const orderData = orderResult.rows[0]
    const orderId = orderData.id

    // Create order items
    // TODO: Pull items from cart via cartId
    await query(
      `INSERT INTO ${TABLE_NAMES.ORDER_ITEMS} (
        order_id,
        product_title,
        quantity,
        unit_price_cents,
        total_price_cents
      ) VALUES (
        $1,
        'Refurbished MacBook Air M1',
        1,
        89900,
        89900
      )`,
      [orderId]
    )

    // TODO: Update seller inventory (decrease quantity)

    logger.info('Order created', {
      orderId,
      userId: params.userId,
      paymentIntentId: params.paymentIntentId,
    })

    return {
      orderId,
      createdAt: orderData.created_at,
    }
  } catch (error) {
    logger.error('Failed to create order', {
      userId: params.userId,
      paymentIntentId: params.paymentIntentId,
      error,
    })
    throw error
  }
}
