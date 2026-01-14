import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { requireStripeClient } from '@/lib/payments/stripe-client'
import { query } from '@/lib/auth/db'
import { apiError, apiSuccess } from '@/lib/api/helpers'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

// Webhook secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

// Stripe event types we want to handle
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

export async function POST(request: NextRequest) {
  // Initialize Stripe lazily inside handler to avoid build-time errors
  const stripe = requireStripeClient()

  try {
    const body = await request.text()
    const headersList = await headers()
    const sig = headersList.get('stripe-signature')

    if (!sig || !endpointSecret) {
      return apiError(null, 'Webhook signature verification failed', 400)
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      logger.error('Webhook signature verification failed', { error: errorMessage })
      return apiError(err, 'Webhook signature verification failed', 400)
    }

    // Only process events we're interested in
    if (!HANDLED_EVENTS.includes(event.type as HandledEvent)) {
      // Acknowledge unhandled events to prevent Stripe retries
      return NextResponse.json({ received: true, handled: false }, { status: 200 })
    }

    // Handle the event
    await handleWebhookEvent(event)

    // Return success response
    return NextResponse.json({ received: true, handled: true }, { status: 200 })
  } catch (error) {
    logger.error('Webhook processing error', { error })
    return apiError(error, 'Webhook processing failed', 500)
  }
}

async function handleWebhookEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.amount_capturable_updated':
        await handlePaymentIntentAmountCapturableUpdated(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object as Stripe.Charge)
        break

      case 'charge.failed':
        await handleChargeFailed(event.data.object as Stripe.Charge)
        break

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute)
        break

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute)
        break

      case 'charge.refund.updated':
        await handleRefundUpdated(event.data.object as Stripe.Refund)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        logger.info('Unhandled webhook event type', { eventType: event.type })
    }
  } catch (error) {
    logger.error('Error handling webhook event', { eventType: event.type, error })
    throw error
  }
}

// Payment Intent Handlers
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment intent succeeded', { paymentIntentId: paymentIntent.id })

  // Update payment transaction status
  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      status = 'succeeded',
      processed_at = CURRENT_TIMESTAMP,
      provider_response = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [paymentIntent.id, JSON.stringify(paymentIntent)])

  // Update related order if exists
  if (paymentIntent.metadata?.orderId) {
    await query(`
      UPDATE ${TABLE_NAMES.ORDERS}
      SET
        payment_status = 'paid',
        status = CASE
          WHEN status = 'pending' THEN 'confirmed'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [paymentIntent.metadata.orderId])
  }

  // Update service appointment if exists
  if (paymentIntent.metadata?.serviceAppointmentId) {
    await query(`
      UPDATE ${TABLE_NAMES.SERVICE_APPOINTMENTS}
      SET
        status = 'confirmed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [paymentIntent.metadata.serviceAppointmentId])
  }

  // Update workshop registration if exists
  if (paymentIntent.metadata?.workshopRegistrationId) {
    await query(`
      UPDATE ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
      SET
        payment_status = 'paid',
        status = 'confirmed',
        confirmed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [paymentIntent.metadata.workshopRegistrationId])
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.warn('Payment intent failed', { paymentIntentId: paymentIntent.id })

  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      status = 'failed',
      failure_reason = $2,
      provider_response = $3,
      processed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [
    paymentIntent.id,
    paymentIntent.last_payment_error?.message || 'Payment failed',
    JSON.stringify(paymentIntent)
  ])
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment intent canceled', { paymentIntentId: paymentIntent.id })

  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      status = 'cancelled',
      provider_response = $2,
      processed_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [paymentIntent.id, JSON.stringify(paymentIntent)])
}

async function handlePaymentIntentAmountCapturableUpdated(paymentIntent: Stripe.PaymentIntent) {
  logger.info('Payment intent amount capturable updated', { paymentIntentId: paymentIntent.id })

  // This is relevant for escrow - funds are now available for capture
  // Update escrow account if this payment intent is part of escrow
  await query(`
    UPDATE ${TABLE_NAMES.ESCROW_ACCOUNTS}
    SET
      status = CASE
        WHEN status = 'active' THEN 'active'
        ELSE status
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE transaction_id = (
      SELECT id FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} WHERE provider_transaction_id = $1
    )
  `, [paymentIntent.id])
}

// Charge Handlers
async function handleChargeSucceeded(charge: Stripe.Charge) {
  logger.info('Charge succeeded', { chargeId: charge.id })

  // Update payment transaction with charge details
  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      fee_cents = $2,
      net_amount_cents = amount_cents - $2,
      provider_response = jsonb_set(
        COALESCE(provider_response, '{}'),
        '{charge}',
        $3
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [
    charge.payment_intent as string,
    0, // Fee is available in balance_transaction when expanded
    JSON.stringify(charge)
  ])
}

async function handleChargeFailed(charge: Stripe.Charge) {
  logger.warn('Charge failed', { chargeId: charge.id })

  // Mark transaction as failed
  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      status = 'failed',
      failure_reason = $2,
      provider_response = jsonb_set(
        COALESCE(provider_response, '{}'),
        '{charge}',
        $3
      ),
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [
    charge.payment_intent as string,
    charge.failure_message || 'Charge failed',
    JSON.stringify(charge)
  ])
}

// Dispute Handlers
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  logger.warn('Dispute created', { disputeId: dispute.id, reason: dispute.reason })

  // Create dispute record
  await query(`
    INSERT INTO ${TABLE_NAMES.PAYMENT_DISPUTES} (
      transaction_id,
      provider_dispute_id,
      amount_cents,
      currency,
      reason,
      status,
      evidence,
      response_deadline
    ) VALUES (
      (SELECT id FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS} WHERE provider_transaction_id = $1),
      $2,
      $3,
      $4,
      $5,
      'opened',
      '{}',
      CURRENT_TIMESTAMP + INTERVAL '21 days'
    )
    ON CONFLICT (provider_dispute_id) DO UPDATE SET
      status = 'opened',
      updated_at = CURRENT_TIMESTAMP
  `, [
    dispute.payment_intent as string,
    dispute.id,
    dispute.amount,
    dispute.currency,
    dispute.reason
  ])

  // Update transaction status to disputed
  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
    SET
      status = 'disputed',
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_transaction_id = $1
  `, [dispute.payment_intent as string])
}

async function handleDisputeClosed(dispute: Stripe.Dispute) {
  logger.info('Dispute closed', { disputeId: dispute.id, status: dispute.status })

  // Update dispute status
  await query(`
    UPDATE ${TABLE_NAMES.PAYMENT_DISPUTES}
    SET
      status = CASE
        WHEN $2 = 'won' THEN 'won'
        WHEN $2 = 'lost' THEN 'lost'
        ELSE 'cancelled'
      END,
      resolution = $2,
      resolved_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE provider_dispute_id = $1
  `, [dispute.id, dispute.status])

  // Update transaction status based on dispute outcome
  if (dispute.status === 'lost') {
    await query(`
      UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
      SET
        status = 'disputed',
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = $1
    `, [dispute.payment_intent as string])
  }
}

// Refund Handlers
async function handleRefundUpdated(refund: Stripe.Refund) {
  logger.info('Refund updated', { refundId: refund.id, status: refund.status })

  // Update refund record
  await query(`
    UPDATE ${TABLE_NAMES.REFUNDS}
    SET
      status = CASE
        WHEN $2 = 'succeeded' THEN 'completed'
        WHEN $2 = 'failed' THEN 'rejected'
        WHEN $2 = 'canceled' THEN 'cancelled'
        ELSE status
      END,
      processed_at = CASE
        WHEN $2 IN ('succeeded', 'failed', 'canceled') THEN CURRENT_TIMESTAMP
        ELSE processed_at
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE refund_transaction_id = $1
  `, [refund.id, refund.status])
}

// Checkout Session Handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  logger.info('Checkout session completed', { sessionId: session.id })

  // Handle completed checkout sessions (e.g., for subscriptions or complex payments)
  // This could trigger order fulfillment, etc.
}

// Invoice Handlers
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  logger.info('Invoice payment succeeded', { invoiceId: invoice.id })

  // Update invoice status
  await query(`
    UPDATE ${TABLE_NAMES.INVOICES}
    SET
      status = 'paid',
      paid_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [invoice.id])
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logger.warn('Invoice payment failed', { invoiceId: invoice.id })

  // Update invoice status
  await query(`
    UPDATE ${TABLE_NAMES.INVOICES}
    SET
      status = 'overdue',
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
  `, [invoice.id])
}