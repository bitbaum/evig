/**
 * Payment Service
 *
 * Business logic layer for payment operations.
 * Extracted from webhook route to improve testability and reusability.
 *
 * **Architecture Benefits**:
 * - Route handlers become thin orchestration (50 lines vs 418)
 * - Business logic is testable without HTTP layer
 * - Can be reused across multiple endpoints
 * - Clear separation of concerns
 *
 * **Pattern**:
 * ```
 * Route (30-50 lines)    → Orchestration, validation, HTTP
 *   ↓
 * Service (100-200 lines) → Business logic, workflows
 *   ↓
 * Repository (50-100 lines) → Data access, SQL queries
 * ```
 *
 * @see ARCHITECTURE_EVALUATION.md - Phase 3: Service Layer Extraction
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

/**
 * Payment service for handling Stripe webhooks and payment operations
 */
export class PaymentService {
  /**
   * Handle payment_intent.succeeded event
   *
   * Business logic:
   * - Update payment transaction status
   * - Update related order if exists
   * - Confirm service appointment if exists
   * - Confirm workshop registration if exists
   *
   * @param paymentIntent - Stripe PaymentIntent object
   */
  async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info('Payment intent succeeded', {
      paymentIntentId: paymentIntent.id,
    })

    // Update payment transaction status
    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         status = 'succeeded',
         processed_at = CURRENT_TIMESTAMP,
         provider_response = $2,
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [paymentIntent.id, JSON.stringify(paymentIntent)]
    )

    // Update related entities based on metadata
    await this.updateRelatedEntitiesOnSuccess(paymentIntent)
  }

  /**
   * Handle payment_intent.payment_failed event
   *
   * @param paymentIntent - Stripe PaymentIntent object
   */
  async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.warn('Payment intent failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    })

    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         status = 'failed',
         failure_reason = $2,
         provider_response = $3,
         processed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [
        paymentIntent.id,
        paymentIntent.last_payment_error?.message || 'Payment failed',
        JSON.stringify(paymentIntent),
      ]
    )
  }

  /**
   * Handle payment_intent.canceled event
   *
   * @param paymentIntent - Stripe PaymentIntent object
   */
  async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info('Payment intent canceled', {
      paymentIntentId: paymentIntent.id,
    })

    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         status = 'cancelled',
         provider_response = $2,
         processed_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [paymentIntent.id, JSON.stringify(paymentIntent)]
    )
  }

  /**
   * Handle payment_intent.amount_capturable_updated event
   *
   * Relevant for escrow - funds are now available for capture
   *
   * @param paymentIntent - Stripe PaymentIntent object
   */
  async handlePaymentIntentAmountCapturableUpdated(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info('Payment intent amount capturable updated', {
      paymentIntentId: paymentIntent.id,
    })

    // Update escrow account if this payment intent is part of escrow
    await query(
      `UPDATE ${TABLE_NAMES.ESCROW_ACCOUNTS}
       SET
         status = CASE
           WHEN status = 'active' THEN 'active'
           ELSE status
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = (
         SELECT id FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
         WHERE provider_transaction_id = $1
       )`,
      [paymentIntent.id]
    )
  }

  /**
   * Handle charge.succeeded event
   *
   * @param charge - Stripe Charge object
   */
  async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    logger.info('Charge succeeded', { chargeId: charge.id })

    // Update payment transaction with charge details
    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         fee_cents = $2,
         net_amount_cents = amount_cents - $2,
         provider_response = jsonb_set(
           COALESCE(provider_response, '{}'),
           '{charge}',
           $3
         ),
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [
        charge.payment_intent as string,
        0, // Fee is available in balance_transaction when expanded
        JSON.stringify(charge),
      ]
    )
  }

  /**
   * Handle charge.failed event
   *
   * @param charge - Stripe Charge object
   */
  async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    logger.warn('Charge failed', { chargeId: charge.id })

    // Mark transaction as failed
    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         status = 'failed',
         failure_reason = $2,
         provider_response = jsonb_set(
           COALESCE(provider_response, '{}'),
           '{charge}',
           $3
         ),
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [
        charge.payment_intent as string,
        charge.failure_message || 'Charge failed',
        JSON.stringify(charge),
      ]
    )
  }

  /**
   * Handle charge.dispute.created event
   *
   * @param dispute - Stripe Dispute object
   */
  async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    logger.warn('Dispute created', {
      disputeId: dispute.id,
      reason: dispute.reason,
    })

    // Create dispute record
    await query(
      `INSERT INTO ${TABLE_NAMES.PAYMENT_DISPUTES} (
         transaction_id,
         provider_dispute_id,
         amount_cents,
         currency,
         reason,
         status,
         evidence,
         response_deadline
       ) VALUES (
         (SELECT id FROM ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
          WHERE provider_transaction_id = $1),
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
         updated_at = CURRENT_TIMESTAMP`,
      [
        dispute.payment_intent as string,
        dispute.id,
        dispute.amount,
        dispute.currency,
        dispute.reason,
      ]
    )

    // Update transaction status to disputed
    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
       SET
         status = 'disputed',
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_transaction_id = $1`,
      [dispute.payment_intent as string]
    )
  }

  /**
   * Handle charge.dispute.closed event
   *
   * @param dispute - Stripe Dispute object
   */
  async handleDisputeClosed(dispute: Stripe.Dispute): Promise<void> {
    logger.info('Dispute closed', {
      disputeId: dispute.id,
      status: dispute.status,
    })

    // Update dispute status
    await query(
      `UPDATE ${TABLE_NAMES.PAYMENT_DISPUTES}
       SET
         status = CASE
           WHEN $2 = 'won' THEN 'won'
           WHEN $2 = 'lost' THEN 'lost'
           ELSE 'cancelled'
         END,
         resolution = $2,
         resolved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE provider_dispute_id = $1`,
      [dispute.id, dispute.status]
    )

    // Update transaction status based on dispute outcome
    if (dispute.status === 'lost') {
      await query(
        `UPDATE ${TABLE_NAMES.PAYMENT_TRANSACTIONS}
         SET
           status = 'disputed',
           updated_at = CURRENT_TIMESTAMP
         WHERE provider_transaction_id = $1`,
        [dispute.payment_intent as string]
      )
    }
  }

  /**
   * Handle charge.refund.updated event
   *
   * @param refund - Stripe Refund object
   */
  async handleRefundUpdated(refund: Stripe.Refund): Promise<void> {
    logger.info('Refund updated', {
      refundId: refund.id,
      status: refund.status,
    })

    // Update refund record
    await query(
      `UPDATE ${TABLE_NAMES.REFUNDS}
       SET
         status = CASE
           WHEN $2 = 'succeeded' THEN 'completed'
           WHEN $2 = 'failed' THEN 'rejected'
           WHEN $2 = 'canceled' THEN 'cancelled'
           ELSE status
         END,
         processed_at = CASE
           WHEN $2 IN ('succeeded', 'failed', 'canceled')
           THEN CURRENT_TIMESTAMP
           ELSE processed_at
         END,
         updated_at = CURRENT_TIMESTAMP
       WHERE refund_transaction_id = $1`,
      [refund.id, refund.status]
    )
  }

  /**
   * Handle checkout.session.completed event
   *
   * @param session - Stripe Checkout Session object
   */
  async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ): Promise<void> {
    logger.info('Checkout session completed', { sessionId: session.id })

    // Handle completed checkout sessions (e.g., for subscriptions or complex payments)
    // This could trigger order fulfillment, etc.
    // TODO: Implement based on business requirements
  }

  /**
   * Handle invoice.payment_succeeded event
   *
   * @param invoice - Stripe Invoice object
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Invoice payment succeeded', { invoiceId: invoice.id })

    // Update invoice status
    await query(
      `UPDATE ${TABLE_NAMES.INVOICES}
       SET
         status = 'paid',
         paid_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [invoice.id]
    )
  }

  /**
   * Handle invoice.payment_failed event
   *
   * @param invoice - Stripe Invoice object
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.warn('Invoice payment failed', { invoiceId: invoice.id })

    // Update invoice status
    await query(
      `UPDATE ${TABLE_NAMES.INVOICES}
       SET
         status = 'overdue',
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [invoice.id]
    )
  }

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Update related entities when payment succeeds
   *
   * @param paymentIntent - Stripe PaymentIntent object
   */
  private async updateRelatedEntitiesOnSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const metadata = paymentIntent.metadata || {}

    // Update related order if exists
    if (metadata.orderId) {
      await query(
        `UPDATE ${TABLE_NAMES.ORDERS}
         SET
           payment_status = 'paid',
           status = CASE
             WHEN status = 'pending' THEN 'confirmed'
             ELSE status
           END,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [metadata.orderId]
      )
    }

    // Update service appointment if exists
    if (metadata.serviceAppointmentId) {
      await query(
        `UPDATE ${TABLE_NAMES.SERVICE_APPOINTMENTS}
         SET
           status = 'confirmed',
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [metadata.serviceAppointmentId]
      )
    }

    // Update workshop registration if exists
    if (metadata.workshopRegistrationId) {
      await query(
        `UPDATE ${TABLE_NAMES.WORKSHOP_REGISTRATIONS}
         SET
           payment_status = 'paid',
           status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [metadata.workshopRegistrationId]
      )
    }
  }
}
