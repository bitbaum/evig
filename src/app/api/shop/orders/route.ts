import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { TABLE_NAMES } from '@/config/database'

interface OrderRow {
  id: string
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { cartId, paymentIntentId, shippingAddress } = await request.json()

    if (!cartId || !paymentIntentId) {
      return apiBadRequest('Cart ID und Payment Intent ID erforderlich')
    }

    // This would integrate with MedusaJS to create the order
    // For now, we'll create a basic order record in our database

    // Create order record
    const orderResult = await query(`
      INSERT INTO ${TABLE_NAMES.ORDERS} (
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
      RETURNING id, created_at
    `, [
      session.user.id,
      97092, // This would come from the cart total
      paymentIntentId,
      shippingAddress ? JSON.stringify(shippingAddress) : null
    ])

    const orderData = orderResult.rows[0] as OrderRow
    const orderId = orderData.id

    // Create order items (this would come from the cart)
    await query(`
      INSERT INTO ${TABLE_NAMES.ORDER_ITEMS} (
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
      )
    `, [orderId])

    // Update seller inventory (decrease quantity)
    // This would be more complex in a real implementation

    return apiSuccess({
      orderId,
      message: 'Bestellung erfolgreich erstellt'
    })

  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}