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

import { db } from '@/db'
import { sql, getTableName } from 'drizzle-orm'
import {
  paymentTransactions,
  escrowAccounts,
  paymentDisputes,
  refunds,
  invoices,
  orders,
  marketplaceOrders,
} from '@/db/schema'
import { serviceAppointments } from '@/db/schema/services'
import { workshopRegistrations } from '@/db/schema/workshops'
import { ORDER_STATUS } from '@/config/marketplace'
import { PAYMENT_STATUS, ESCROW_STATUS } from '@/config/payment-status'
import { REFUND_STATUS } from '@/config/refund'
import { INVOICE_STATUS } from '@/config/invoice-status'
import { logger } from '@/lib/logger'
import type Stripe from 'stripe'

// Table name refs
const ptTable = getTableName(paymentTransactions)
const eaTable = getTableName(escrowAccounts)
const pdTable = getTableName(paymentDisputes)
const rTable = getTableName(refunds)
const invTable = getTableName(invoices)
const ordersTable = getTableName(orders)
const moTable = getTableName(marketplaceOrders)
const saTable = getTableName(serviceAppointments)
const wrTable = getTableName(workshopRegistrations)

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
    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        status = ${PAYMENT_STATUS.SUCCEEDED},
        processed_at = CURRENT_TIMESTAMP,
        provider_response = ${JSON.stringify(paymentIntent)},
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${paymentIntent.id}
    `)

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

    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        status = ${PAYMENT_STATUS.FAILED},
        failure_reason = ${paymentIntent.last_payment_error?.message || 'Payment failed'},
        provider_response = ${JSON.stringify(paymentIntent)},
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${paymentIntent.id}
    `)
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

    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        status = ${PAYMENT_STATUS.CANCELLED},
        provider_response = ${JSON.stringify(paymentIntent)},
        processed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${paymentIntent.id}
    `)
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
    await db.execute(sql`
      UPDATE ${sql.raw(eaTable)}
      SET
        status = CASE
          WHEN status = ${ESCROW_STATUS.ACTIVE} THEN ${ESCROW_STATUS.ACTIVE}
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE transaction_id = (
        SELECT id FROM ${sql.raw(ptTable)}
        WHERE provider_transaction_id = ${paymentIntent.id}
      )
    `)
  }

  /**
   * Handle charge.succeeded event
   *
   * @param charge - Stripe Charge object
   */
  async handleChargeSucceeded(charge: Stripe.Charge): Promise<void> {
    logger.info('Charge succeeded', { chargeId: charge.id })

    // Update payment transaction with charge details
    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        fee_cents = ${0},
        net_amount_cents = amount_cents - ${0},
        provider_response = jsonb_set(
          COALESCE(provider_response, '{}'),
          '{charge}',
          ${JSON.stringify(charge)}
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${charge.payment_intent as string}
    `)
  }

  /**
   * Handle charge.failed event
   *
   * @param charge - Stripe Charge object
   */
  async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    logger.warn('Charge failed', { chargeId: charge.id })

    // Mark transaction as failed
    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        status = ${PAYMENT_STATUS.FAILED},
        failure_reason = ${charge.failure_message || 'Charge failed'},
        provider_response = jsonb_set(
          COALESCE(provider_response, '{}'),
          '{charge}',
          ${JSON.stringify(charge)}
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${charge.payment_intent as string}
    `)
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
    await db.execute(sql`
      INSERT INTO ${sql.raw(pdTable)} (
        transaction_id,
        provider_dispute_id,
        amount_cents,
        currency,
        reason,
        status,
        evidence,
        response_deadline
      ) VALUES (
        (SELECT id FROM ${sql.raw(ptTable)}
         WHERE provider_transaction_id = ${dispute.payment_intent as string}),
        ${dispute.id},
        ${dispute.amount},
        ${dispute.currency},
        ${dispute.reason},
        'opened',
        '{}',
        CURRENT_TIMESTAMP + INTERVAL '21 days'
      )
      ON CONFLICT (provider_dispute_id) DO UPDATE SET
        status = 'opened',
        updated_at = CURRENT_TIMESTAMP
    `)

    // Update transaction status to disputed
    await db.execute(sql`
      UPDATE ${sql.raw(ptTable)}
      SET
        status = 'disputed',
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_transaction_id = ${dispute.payment_intent as string}
    `)
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
    await db.execute(sql`
      UPDATE ${sql.raw(pdTable)}
      SET
        status = CASE
          WHEN ${dispute.status} = 'won' THEN 'won'
          WHEN ${dispute.status} = 'lost' THEN 'lost'
          ELSE 'cancelled'
        END,
        resolution = ${dispute.status},
        resolved_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE provider_dispute_id = ${dispute.id}
    `)

    // Update transaction status based on dispute outcome
    if (dispute.status === 'lost') {
      await db.execute(sql`
        UPDATE ${sql.raw(ptTable)}
        SET
          status = 'disputed',
          updated_at = CURRENT_TIMESTAMP
        WHERE provider_transaction_id = ${dispute.payment_intent as string}
      `)
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
    await db.execute(sql`
      UPDATE ${sql.raw(rTable)}
      SET
        status = CASE
          WHEN ${refund.status} = 'succeeded' THEN ${REFUND_STATUS.COMPLETED}
          WHEN ${refund.status} = 'failed' THEN ${REFUND_STATUS.REJECTED}
          WHEN ${refund.status} = 'canceled' THEN ${PAYMENT_STATUS.CANCELLED}
          ELSE status
        END,
        processed_at = CASE
          WHEN ${refund.status} IN ('succeeded', 'failed', 'canceled')
          THEN CURRENT_TIMESTAMP
          ELSE processed_at
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE refund_transaction_id = ${refund.id}
    `)
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

    // No-op: payment provider decision pending (Stripe vs Payrexx).
    // Current payment flows use PaymentIntents directly — this handler
    // is registered for forward-compatibility only.
  }

  /**
   * Handle invoice.payment_succeeded event
   *
   * @param invoice - Stripe Invoice object
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    logger.info('Invoice payment succeeded', { invoiceId: invoice.id })

    // Update invoice status
    await db.execute(sql`
      UPDATE ${sql.raw(invTable)}
      SET
        status = ${INVOICE_STATUS.PAID},
        paid_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoice.id}
    `)
  }

  /**
   * Handle invoice.payment_failed event
   *
   * @param invoice - Stripe Invoice object
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    logger.warn('Invoice payment failed', { invoiceId: invoice.id })

    // Update invoice status
    await db.execute(sql`
      UPDATE ${sql.raw(invTable)}
      SET
        status = ${INVOICE_STATUS.OVERDUE},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${invoice.id}
    `)
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
      await db.execute(sql`
        UPDATE ${sql.raw(ordersTable)}
        SET
          payment_status = ${PAYMENT_STATUS.SUCCEEDED},
          status = CASE
            WHEN status = ${PAYMENT_STATUS.PENDING} THEN ${PAYMENT_STATUS.CONFIRMED}
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${metadata.orderId}
      `)
    }

    // Update service appointment if exists
    if (metadata.serviceAppointmentId) {
      await db.execute(sql`
        UPDATE ${sql.raw(saTable)}
        SET
          status = ${PAYMENT_STATUS.CONFIRMED},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${metadata.serviceAppointmentId}
      `)
    }

    // Update workshop registration if exists
    if (metadata.workshopRegistrationId) {
      await db.execute(sql`
        UPDATE ${sql.raw(wrTable)}
        SET
          payment_status = ${PAYMENT_STATUS.SUCCEEDED},
          status = ${PAYMENT_STATUS.CONFIRMED},
          confirmed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${metadata.workshopRegistrationId}
      `)
    }

    // Update marketplace order if exists (P2P marketplace secure payment)
    if (metadata.marketplaceOrderId) {
      await db.execute(sql`
        UPDATE ${sql.raw(moTable)}
        SET
          status = ${ORDER_STATUS.PAID},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${metadata.marketplaceOrderId} AND status = ${ORDER_STATUS.PENDING_PAYMENT}
      `)
      logger.info('Marketplace order marked as paid via webhook', {
        orderId: metadata.marketplaceOrderId,
        paymentIntentId: paymentIntent.id,
      })
    }
  }
}
