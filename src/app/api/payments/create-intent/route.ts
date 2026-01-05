import { NextRequest } from 'next/server'
import { auth } from '@/auth'
import Stripe from 'stripe'
import { apiError, apiSuccess, apiUnauthorized, apiBadRequest } from '@/lib/api/helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED)
    }

    const { cartId, amount, currency = 'chf' } = await request.json()

    if (!cartId || !amount) {
      return apiBadRequest('Cart ID und Betrag erforderlich')
    }

    // Verify the cart belongs to the user (this would integrate with MedusaJS)
    // For now, we'll assume the cart is valid

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata: {
        cartId,
        userId: session.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // In production, you might want to:
      // - Set up webhooks for payment confirmation
      // - Store payment intent ID in your database
      // - Set up proper error handling
    })

    return apiSuccess({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Fehler beim Erstellen der Zahlung'
    return apiError(error, errorMessage)
  }
}