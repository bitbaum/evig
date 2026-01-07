import Stripe from 'stripe'

/**
 * Get Stripe client instance
 * Returns null if Stripe is not configured (for build-time safety)
 */
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY
  
  if (!secretKey) {
    return null
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20',
  })
}

/**
 * Get Stripe client or throw error
 * Use this when Stripe is required for the operation
 */
export function requireStripeClient(): Stripe {
  const client = getStripeClient()
  
  if (!client) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.')
  }
  
  return client
}
