/**
 * Stripe Payment Webhook
 *
 * REFACTORED: Business logic moved to PaymentService
 * Route is now thin orchestration layer (129 lines vs 419)
 *
 * @see src/lib/services/payment-service.ts - Business logic
 * @see ARCHITECTURE_EVALUATION.md - Phase 3: Service Layer Extraction
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { apiError } from '@/lib/api/helpers'
import { logger } from '@/lib/logger'
import { PaymentService } from '@/lib/services'

// Webhook secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Stripe event types we handle
const HANDLED_EVENTS = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.canceled',
  'payment_intent.amount_capturable_updated',
  'charge.succeeded',
  'charge.failed',
  'charge.dispute.created',
  'charge.dispute.closed',
  'charge.refund.updated',
  'checkout.session.completed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
] as const

type HandledEvent = typeof HANDLED_EVENTS[number]

/**
 * POST /api/payments/webhook
 *
 * Handles Stripe webhook events by:
 * 1. Verifying webhook signature
 * 2. Delegating to PaymentService for business logic
 */
export async function POST(request: NextRequest) {
  const stripe = requireStripeClient()
  const paymentService = new PaymentService()

  try {
    // Verify webhook signature
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig || !endpointSecret) {
      return apiError(null, 'Webhook signature verification failed', 400)
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Webhook signature verification failed', { error: errorMessage })
      return apiError(err, 'Webhook signature verification failed', 400)
    }

    // Acknowledge unhandled events immediately
    if (!HANDLED_EVENTS.includes(event.type as HandledEvent)) {
      return NextResponse.json({ received: true, handled: false }, { status: 200 })
    }

    // Delegate to PaymentService for business logic
    await handleWebhookEvent(paymentService, event)

    return NextResponse.json({ received: true, handled: true }, { status: 200 })
  } catch (error) {
    logger.error('Webhook processing error', { error })
    return apiError(error, 'Webhook processing failed', 500)
  }
}

/**
 * Route events to PaymentService handlers
 */
async function handleWebhookEvent(service: PaymentService, event: Stripe.Event) {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await service.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
      break
    case 'payment_intent.payment_failed':
      await service.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
      break
    case 'payment_intent.canceled':
      await service.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
      break
    case 'payment_intent.amount_capturable_updated':
      await service.handlePaymentIntentAmountCapturableUpdated(event.data.object as Stripe.PaymentIntent)
      break
    case 'charge.succeeded':
      await service.handleChargeSucceeded(event.data.object as Stripe.Charge)
      break
    case 'charge.failed':
      await service.handleChargeFailed(event.data.object as Stripe.Charge)
      break
    case 'charge.dispute.created':
      await service.handleDisputeCreated(event.data.object as Stripe.Dispute)
      break
    case 'charge.dispute.closed':
      await service.handleDisputeClosed(event.data.object as Stripe.Dispute)
      break
    case 'charge.refund.updated':
      await service.handleRefundUpdated(event.data.object as Stripe.Refund)
      break
    case 'checkout.session.completed':
      await service.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
      break
    case 'invoice.payment_succeeded':
      await service.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await service.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
      break
    default:
      logger.info('Unhandled webhook event type', { eventType: event.type })
  }
}
