/**
 * Shop Orders API
 * POST /api/shop/orders - Create a new order from a completed payment
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'
import { createOrder } from '@/lib/services/order-service'

const shippingAddressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(2).max(2).default('CH'),
}).optional()

const createOrderSchema = z.object({
  cartId: z.string().min(1, 'Cart ID erforderlich'),
  paymentIntentId: z.string().optional().default('pending'),
  shippingAddress: shippingAddressSchema,
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    // 2. Parse and validate body
    const body = await request.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues.map(i => i.message).join(', '))
    }
    const { cartId, paymentIntentId, shippingAddress } = parsed.data

    // 3. Call service
    const result = await createOrder({
      userId: session.user.id,
      cartId,
      paymentIntentId,
      shippingAddress,
    })

    // 4. Return response
    return apiSuccess({
      orderId: result.orderId,
      message: 'Bestellung erfolgreich erstellt',
    })
  } catch (error) {
    return apiError(error, ERROR_MESSAGES.INTERNAL_SERVER_ERROR)
  }
}