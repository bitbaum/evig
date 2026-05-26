/**
 * Payment Webhook Service
 *
 * Business logic for processing Payrexx payment webhook callbacks.
 * Handles marketplace orders, workshop registrations, and service appointments.
 */

import { db } from '@/db'
import { marketplaceOrders, listings, users, paymentTransactions, workshopRegistrations, serviceAppointments } from '@/db/schema'
import { inventoryItems } from '@/db/schema/inventory'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import {
  orderConfirmationBuyer,
  newOrderNotificationSeller,
} from '@/lib/email/templates/marketplace'
import { formatCHF, DELIVERY_LABELS, ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { PAYREXX_TRANSACTION_STATUS } from '@/lib/payments/payrexx-client'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_PAYMENT_STATUS } from '@/config/workshop-registration-status'
import { APP_URL } from '@/config/urls'
import type { DeliveryOption } from '@/config/marketplace'
import {
  createKivviInvoice,
  updateKivviDocumentStatus,
  recordKivviPayment,
  updateKivviInventoryItem,
} from '@/lib/kivvi/client'
import { triggerInviterReward } from '@/lib/referral'

// ============================================================================
// Types
// ============================================================================

interface MarketplaceOrder {
  id: string
  buyerId: string
  sellerId: string
  listingId: string
  amountChf: string
  commissionChf: string
  sellerPayoutChf: string
  status: string
  deliveryMethod: string
}

interface PaymentTransaction {
  id: string
  status: string
  workshopRegistrationId: string | null
  serviceAppointmentId: string | null
  amountCents: number
}

/** Result from looking up a payment record by referenceId */
export interface PaymentLookupResult {
  type: 'marketplace' | 'payment_transaction' | 'not_found'
  order?: MarketplaceOrder
  paymentTx?: PaymentTransaction
}

// ============================================================================
// Lookup
// ============================================================================

/** Find the payment record matching a Payrexx referenceId */
export async function lookupPaymentByReferenceId(referenceId: string): Promise<PaymentLookupResult> {
  // Try marketplace order first
  const orderRows = await db
    .select({
      id: marketplaceOrders.id,
      buyerId: marketplaceOrders.buyerId,
      sellerId: marketplaceOrders.sellerId,
      listingId: marketplaceOrders.listingId,
      amountChf: marketplaceOrders.amountChf,
      commissionChf: marketplaceOrders.commissionChf,
      sellerPayoutChf: marketplaceOrders.sellerPayoutChf,
      status: marketplaceOrders.status,
      deliveryMethod: marketplaceOrders.deliveryMethod,
    })
    .from(marketplaceOrders)
    .where(eq(marketplaceOrders.id, referenceId))

  if (orderRows[0]) {
    return { type: 'marketplace', order: orderRows[0] }
  }

  // Try payment transaction (workshops, appointments)
  const txRows = await db
    .select({
      id: paymentTransactions.id,
      status: paymentTransactions.status,
      workshopRegistrationId: paymentTransactions.workshopRegistrationId,
      serviceAppointmentId: paymentTransactions.serviceAppointmentId,
      amountCents: paymentTransactions.amountCents,
    })
    .from(paymentTransactions)
    .where(eq(paymentTransactions.id, referenceId))

  if (txRows[0]) {
    return { type: 'payment_transaction', paymentTx: txRows[0] }
  }

  return { type: 'not_found' }
}

// ============================================================================
// Marketplace order handling
// ============================================================================

/**
 * Process a Payrexx webhook status for a marketplace order.
 * Returns true if the status was handled (even if skipped as idempotent).
 */
export async function handleMarketplacePayment(
  order: MarketplaceOrder,
  status: string,
  transactionId: string | null
): Promise<void> {
  switch (status) {
    case PAYREXX_TRANSACTION_STATUS.RESERVED: {
      if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
        logger.info('Payrexx webhook: order not in pending_payment, skipping', {
          orderId: order.id,
          currentStatus: order.status,
        })
        return
      }

      await db
        .update(marketplaceOrders)
        .set({
          status: ORDER_STATUS.PAID,
          payrexxTransactionId: transactionId,
          updatedAt: sql`NOW()`,
        })
        .where(eq(marketplaceOrders.id, order.id))

      logger.info('Marketplace order marked paid via Payrexx', {
        orderId: order.id,
        transactionId,
      })

      // Fire-and-forget email notifications
      sendOrderEmails(order).catch(err =>
        logger.error('Failed to send order emails', { error: err, orderId: order.id })
      )

      // Fire-and-forget Kivvi accounting sync
      // Creates invoice → marks sent (GL entries) → records payment (clears AR)
      syncOrderToKivvi(order, transactionId).catch(err =>
        logger.error('Kivvi accounting sync failed — order paid but not in GL', {
          error: err,
          orderId: order.id,
        })
      )

      // Fire-and-forget inviter reward (CHF 10 coupon on buyer's first purchase)
      triggerInviterReward(order.buyerId).catch(err =>
        logger.error('Referral inviter reward failed', { error: err, orderId: order.id, buyerId: order.buyerId })
      )
      break
    }

    case PAYREXX_TRANSACTION_STATUS.CONFIRMED: {
      if (order.status !== ORDER_STATUS.PAID && order.status !== ORDER_STATUS.DELIVERED) {
        logger.info('Payrexx webhook: unexpected confirmed status', {
          orderId: order.id,
          currentStatus: order.status,
        })
        return
      }

      await db
        .update(marketplaceOrders)
        .set({
          status: ORDER_STATUS.COMPLETED,
          updatedAt: sql`NOW()`,
        })
        .where(eq(marketplaceOrders.id, order.id))
      break
    }

    case PAYREXX_TRANSACTION_STATUS.CANCELLED:
    case PAYREXX_TRANSACTION_STATUS.DECLINED: {
      if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
        return
      }

      // Atomic: cancel the order AND restore the listing in one shot.
      // Previously these were two independent auto-commit updates. If the
      // listings restore failed (network blip, FK contention) after the
      // order was already CANCELLED, the listing stayed in RESERVED
      // forever — permanently locked, can't be bought by anyone else,
      // can't be re-listed by the seller. Same root cause as the
      // admin-user-delete (b41c7b21) and inventory-delete (d5ea93bd)
      // multi-write fixes; payments are even more impact-sensitive
      // because the listing lock can't be observed by the seller.
      await db.transaction(async (tx) => {
        await tx
          .update(marketplaceOrders)
          .set({
            status: ORDER_STATUS.CANCELLED,
            updatedAt: sql`NOW()`,
          })
          .where(eq(marketplaceOrders.id, order.id))

        // Restore listing to active
        await tx
          .update(listings)
          .set({ status: LISTING_STATUS.ACTIVE })
          .where(
            and(
              eq(listings.id, order.listingId),
              eq(listings.status, LISTING_STATUS.RESERVED)
            )
          )
      })

      logger.info('Marketplace order cancelled via Payrexx webhook', {
        orderId: order.id,
        reason: status,
      })
      break
    }

    case PAYREXX_TRANSACTION_STATUS.REFUNDED:
    case PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED: {
      await db
        .update(marketplaceOrders)
        .set({
          status: ORDER_STATUS.REFUNDED,
          updatedAt: sql`NOW()`,
        })
        .where(eq(marketplaceOrders.id, order.id))

      logger.info('Marketplace order refunded via Payrexx webhook', {
        orderId: order.id,
        status,
      })
      break
    }

    default:
      logger.info('Payrexx webhook: unhandled status', { status, orderId: order.id })
  }
}

// ============================================================================
// Generic payment handling (workshops, appointments)
// ============================================================================

/**
 * Process a Payrexx webhook status for a generic payment transaction
 * (workshops, service appointments).
 */
export async function handleGenericPayment(
  paymentTx: PaymentTransaction,
  status: string,
  payrexxTransactionId: string | null
): Promise<void> {
  switch (status) {
    case PAYREXX_TRANSACTION_STATUS.RESERVED: {
      if (paymentTx.status !== PAYMENT_STATUS.PENDING) {
        logger.info('Payrexx webhook: payment transaction not pending, skipping', {
          transactionId: paymentTx.id,
          currentStatus: paymentTx.status,
        })
        return
      }

      // Atomic: payment is recorded as SUCCEEDED AND the linked
      // registration/appointment is confirmed in one shot. The HIGHEST-
      // impact transaction gap in this file — without the transaction,
      // a failure on the second update (workshopRegistrations or
      // serviceAppointments) after the first commits leaves the user
      // PAID but their registration still PENDING. They've paid real
      // money and the platform shows their workshop spot or appointment
      // as unconfirmed — locked out of what they paid for. The next
      // webhook retry doesn't recover because the early-return at
      // `paymentTx.status !== PENDING` skips the whole block.
      await db.transaction(async (tx) => {
        await tx
          .update(paymentTransactions)
          .set({
            status: PAYMENT_STATUS.SUCCEEDED,
            providerTransactionId: payrexxTransactionId || undefined,
            processedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(paymentTransactions.id, paymentTx.id))

        // Update linked workshop registration
        if (paymentTx.workshopRegistrationId) {
          await tx
            .update(workshopRegistrations)
            .set({
              paymentStatus: WORKSHOP_PAYMENT_STATUS.PAID,
              status: WORKSHOP_REGISTRATION_STATUS.CONFIRMED,
              confirmedAt: sql`CURRENT_TIMESTAMP`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(workshopRegistrations.id, paymentTx.workshopRegistrationId))
        }

        // Update linked service appointment
        if (paymentTx.serviceAppointmentId) {
          await tx
            .update(serviceAppointments)
            .set({
              status: APPOINTMENT_STATUS.CONFIRMED,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(serviceAppointments.id, paymentTx.serviceAppointmentId))
        }
      })

      if (paymentTx.workshopRegistrationId) {
        logger.info('Workshop registration confirmed via Payrexx', {
          registrationId: paymentTx.workshopRegistrationId,
          transactionId: paymentTx.id,
        })
      }
      if (paymentTx.serviceAppointmentId) {
        logger.info('Service appointment confirmed via Payrexx payment', {
          appointmentId: paymentTx.serviceAppointmentId,
          transactionId: paymentTx.id,
        })
      }

      break
    }

    case PAYREXX_TRANSACTION_STATUS.CANCELLED:
    case PAYREXX_TRANSACTION_STATUS.DECLINED: {
      // Atomic: failed payment + registration revert + participant-count
      // decrement + appointment revert in one shot. Without the
      // transaction, a failure on the participant-count decrement after
      // the registration was already flipped to CANCELLED leaves a
      // phantom +1 on workshop_instances.current_participants — the
      // exact drift the existing comment warns about. Over time the
      // capacity check at register-with-payment.ts:102 blocks
      // legitimate users from a workshop that's not actually full.
      // GREATEST(...,0) still clamps so a duplicate webhook can't drive
      // the count negative.
      await db.transaction(async (tx) => {
        await tx
          .update(paymentTransactions)
          .set({
            status: PAYMENT_STATUS.FAILED,
            failureReason: status === PAYREXX_TRANSACTION_STATUS.DECLINED ? 'Payment declined' : 'Payment cancelled',
            processedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(paymentTransactions.id, paymentTx.id))

        // Revert workshop registration + decrement participant count
        if (paymentTx.workshopRegistrationId) {
          // Look up the instanceId first (the registration row will be
          // flipped to cancelled below, but we still need to know which
          // instance's count to decrement).
          const [reg] = await tx
            .select({ workshopInstanceId: workshopRegistrations.workshopInstanceId })
            .from(workshopRegistrations)
            .where(eq(workshopRegistrations.id, paymentTx.workshopRegistrationId))

          await tx
            .update(workshopRegistrations)
            .set({
              paymentStatus: WORKSHOP_PAYMENT_STATUS.NOT_REQUIRED,
              status: WORKSHOP_REGISTRATION_STATUS.CANCELLED,
              cancelledAt: sql`CURRENT_TIMESTAMP`,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(workshopRegistrations.id, paymentTx.workshopRegistrationId))

          if (reg?.workshopInstanceId) {
            // current_participants is a real DB column (cms-api migration 003)
            // but isn't modeled in the Drizzle schema — fall back to raw SQL.
            // Matches the increment shape in register-with-payment/route.ts:141.
            await tx.execute(sql`
              UPDATE workshop_instances
              SET current_participants = GREATEST(current_participants - 1, 0)
              WHERE id = ${reg.workshopInstanceId}
            `)
          }
        }

        // Revert service appointment
        if (paymentTx.serviceAppointmentId) {
          await tx
            .update(serviceAppointments)
            .set({
              status: APPOINTMENT_STATUS.CANCELLED,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(serviceAppointments.id, paymentTx.serviceAppointmentId))
        }
      })

      logger.info('Payment transaction failed via Payrexx webhook', {
        transactionId: paymentTx.id,
        reason: status,
      })
      break
    }

    case PAYREXX_TRANSACTION_STATUS.REFUNDED:
    case PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED: {
      await db
        .update(paymentTransactions)
        .set({
          status: PAYMENT_STATUS.REFUNDED,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(paymentTransactions.id, paymentTx.id))

      logger.info('Payment transaction refunded via Payrexx webhook', {
        transactionId: paymentTx.id,
        status,
      })
      break
    }

    default:
      logger.info('Payrexx webhook: unhandled status for payment transaction', {
        status,
        transactionId: paymentTx.id,
      })
  }
}

// ============================================================================
// Kivvi ERP accounting sync
// ============================================================================

/**
 * Push a confirmed marketplace sale to Kivvi ERP so it hits the general ledger.
 *
 * Flow:
 *   1. Fetch listing title + buyer info + Kivvi inventory item ID
 *   2. Create invoice in Kivvi (RE-YYYY-NNNNN)
 *   3. Mark invoice as "sent" → triggers GL entries (AR debit / Revenue credit)
 *   4. Record payment → closes the loop (Bank debit / AR credit)
 *   5. Mark Kivvi inventory item as sold (status: "sold")
 *
 * This is fire-and-forget — the order is already marked paid in RevampIT.
 * Any error here is logged but does not affect the buyer/seller experience.
 */
async function syncOrderToKivvi(
  order: MarketplaceOrder,
  payrexxTransactionId: string | null,
): Promise<void> {
  // 1. Fetch listing details + buyer info + inventory item Kivvi ID
  const rows = await db
    .select({
      listingTitle: listings.title,
      priceChf: listings.priceChf,
      buyerName: users.name,
      buyerEmail: users.email,
      inventoryItemId: listings.inventoryItemId,
    })
    .from(marketplaceOrders)
    .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
    .innerJoin(users, eq(marketplaceOrders.buyerId, users.id))
    .where(eq(marketplaceOrders.id, order.id))
    .limit(1)

  const info = rows[0]
  if (!info) {
    logger.warn('Kivvi sync: could not fetch order details', { orderId: order.id })
    return
  }

  // Look up the Kivvi inventory item ID (if this listing is backed by an inventory item)
  let kivviInventoryItemId: string | undefined
  if (info.inventoryItemId) {
    const itemRows = await db
      .select({ kivviInventoryItemId: inventoryItems.kivviInventoryItemId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, info.inventoryItemId))
      .limit(1)
    kivviInventoryItemId = itemRows[0]?.kivviInventoryItemId ?? undefined
  }

  // 2. Create Kivvi invoice
  const invoice = await createKivviInvoice({
    contactName: info.buyerName || 'Unbekannter Käufer',
    contactEmail: info.buyerEmail || undefined,
    items: [
      {
        description: info.listingTitle,
        quantity: '1',
        unitPrice: order.amountChf,
        vatRate: '8.1', // Standard Swiss MWST — marketplace items are CHF-priced incl. VAT
        kivviInventoryItemId,
      },
    ],
    notes: payrexxTransactionId
      ? `Payrexx Transaktion: ${payrexxTransactionId}`
      : undefined,
  })

  logger.info('Kivvi invoice created for marketplace order', {
    orderId: order.id,
    kivviDocumentId: invoice.id,
    invoiceNumber: invoice.number,
  })

  // 3. Mark invoice as sent → triggers GL: Debit 1100 AR / Credit 3000 Revenue + 2200 VAT
  await updateKivviDocumentStatus(invoice.id, 'sent')

  // 4. Record payment → GL: Debit 1020 Bank / Credit 1100 AR
  const today = new Date().toISOString().split('T')[0]
  await recordKivviPayment(invoice.id, {
    amount: order.amountChf,
    date: today,
    method: 'other', // Payrexx online payment
    reference: payrexxTransactionId || undefined,
  })

  logger.info('Kivvi accounting loop closed for marketplace order', {
    orderId: order.id,
    kivviDocumentId: invoice.id,
    amount: order.amountChf,
  })

  // 5. Mark Kivvi inventory item as sold (fire-and-forget, best effort)
  if (kivviInventoryItemId) {
    updateKivviInventoryItem(kivviInventoryItemId, { status: 'sold' }).catch(err =>
      logger.warn('Kivvi: failed to mark inventory item sold', {
        kivviInventoryItemId,
        error: err,
      })
    )
  }
}

// ============================================================================
// Email notifications
// ============================================================================

async function sendOrderEmails(order: {
  id: string
  buyerId: string
  sellerId: string
  listingId: string
  amountChf: string
  commissionChf: string
  sellerPayoutChf: string
  deliveryMethod: string
}) {
  const orderUrl = `${APP_URL}/dashboard/orders/${order.id}`
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod

  // Fetch listing title + buyer info
  const infoRows = await db
    .select({
      title: listings.title,
      buyerName: users.name,
      buyerEmail: users.email,
    })
    .from(marketplaceOrders)
    .innerJoin(listings, eq(marketplaceOrders.listingId, listings.id))
    .innerJoin(users, eq(marketplaceOrders.buyerId, users.id))
    .where(eq(marketplaceOrders.id, order.id))

  const buyerInfo = infoRows[0]
  if (!buyerInfo) return

  // Fetch seller info separately (different user join)
  const sellerRows = await db
    .select({
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(users)
    .where(eq(users.id, order.sellerId))

  const sellerInfo = sellerRows[0]

  // Buyer confirmation
  if (buyerInfo.buyerEmail) {
    await sendCustomEmail(
      buyerInfo.buyerEmail,
      orderConfirmationBuyer({
        recipientName: buyerInfo.buyerName || 'Käufer',
        listingTitle: buyerInfo.title,
        amountChf: formatCHF(Number(order.amountChf)),
        commissionChf: formatCHF(Number(order.commissionChf)),
        deliveryMethod: deliveryLabel,
        orderUrl,
      })
    )
  }

  // Seller notification
  if (sellerInfo?.sellerEmail) {
    await sendCustomEmail(
      sellerInfo.sellerEmail,
      newOrderNotificationSeller({
        recipientName: sellerInfo.sellerName || 'Verkäufer',
        buyerName: buyerInfo.buyerName || 'Käufer',
        listingTitle: buyerInfo.title,
        payoutAmountChf: formatCHF(Number(order.sellerPayoutChf)),
        deliveryMethod: deliveryLabel,
        orderUrl: `${APP_URL}/dashboard/orders/${order.id}`,
      })
    )
  }
}
