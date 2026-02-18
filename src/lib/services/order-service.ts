/**
 * Order Service
 *
 * Business logic for order creation.
 * Fetches real cart data from Medusa, creates order records,
 * and decrements inventory.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { MEDUSA_CONFIG } from '@/config/medusa'
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
  paymentIntentId?: string
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

interface MedusaCartItem {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  quantity: number
  unit_price: number
  subtotal: number
  variant_id: string
  variant: {
    id: string
    sku: string | null
  }
}

interface MedusaCart {
  id: string
  items: MedusaCartItem[]
  total: number
  subtotal: number
  tax_total: number
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Create a new order from a Medusa cart.
 *
 * Fetches the cart from Medusa Store API, creates order + order items
 * with real totals, looks up inventory items by medusa_variant_id,
 * and decrements quantity_available.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreatedOrder> {
  const { userId, cartId, paymentIntentId = 'pending', shippingAddress } = params

  try {
    // Fetch real cart data from Medusa
    const cart = await fetchMedusaCart(cartId)

    if (!cart || cart.items.length === 0) {
      throw new Error('Warenkorb ist leer oder nicht gefunden')
    }

    // Create order record with real totals
    const orderResult = await query<OrderRow>(
      `INSERT INTO ${TABLE_NAMES.ORDERS} (
        user_id,
        status,
        total_amount_cents,
        currency,
        payment_intent_id,
        shipping_address,
        medusa_cart_id
      ) VALUES ($1, 'confirmed', $2, 'CHF', $3, $4, $5)
      RETURNING id, created_at`,
      [
        userId,
        cart.total,
        paymentIntentId,
        shippingAddress ? JSON.stringify(shippingAddress) : null,
        cartId,
      ],
    )

    const orderData = orderResult.rows[0]
    const orderId = orderData.id

    // Create order items from cart
    for (const item of cart.items) {
      await query(
        `INSERT INTO ${TABLE_NAMES.ORDER_ITEMS} (
          order_id,
          product_title,
          quantity,
          unit_price_cents,
          total_price_cents,
          medusa_variant_id
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.title,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.variant?.id || item.variant_id,
        ],
      )

      // Look up inventory item by medusa_variant_id and decrement quantity
      const variantId = item.variant?.id || item.variant_id
      if (variantId) {
        await query(
          `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
           SET quantity_available = GREATEST(quantity_available - $1, 0)
           WHERE medusa_variant_id = $2`,
          [item.quantity, variantId],
        )
      }
    }

    logger.info('Order created', {
      orderId,
      userId,
      cartId,
      totalCents: cart.total,
      itemCount: cart.items.length,
    })

    return {
      orderId,
      createdAt: orderData.created_at,
    }
  } catch (error) {
    logger.error('Failed to create order', {
      userId,
      cartId,
      error,
    })
    throw error
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Fetch cart from Medusa Store API using the publishable key.
 */
async function fetchMedusaCart(cartId: string): Promise<MedusaCart | null> {
  try {
    const response = await fetch(`${MEDUSA_CONFIG.URL}/store/carts/${cartId}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-key': MEDUSA_CONFIG.PUBLISHABLE_KEY,
      },
    })

    if (!response.ok) {
      logger.error('Failed to fetch Medusa cart', {
        cartId,
        status: response.status,
      })
      return null
    }

    const data = await response.json()
    return data.cart as MedusaCart
  } catch (error) {
    logger.error('Error fetching Medusa cart', { cartId, error })
    return null
  }
}
