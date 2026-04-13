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
import { APPOINTMENT_STATUS } from '@/config/appointment-status'
import { WORKSHOP_REGISTRATION_STATUS } from '@/config/workshop-registration-status'
import { APP_URL } from '@/config/urls'
import type { DeliveryOption } from '@/config/marketplace'
import {
  createKivviInvoice,
  updateKivviDocumentStatus,
  recordKivviPayment,
  updateKivviInventoryItem,
} from '@/lib/kivvi/client'

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
    case 'reserved': {
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
      break
    }

    case 'confirmed': {
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

    case 'cancelled':
    case 'declined': {
      if (order.status === ORDER_STATUS.COMPLETED || order.status === ORDER_STATUS.CANCELLED) {
        return
      }

      await db
        .update(marketplaceOrders)
        .set({
          status: ORDER_STATUS.CANCELLED,
          updatedAt: sql`NOW()`,
        })
        .where(eq(marketplaceOrders.id, order.id))

      // Restore listing to active
      await db
        .update(listings)
        .set({ status: LISTING_STATUS.ACTIVE })
        .where(
          and(
            eq(listings.id, order.listingId),
            eq(listings.status, LISTING_STATUS.RESERVED)
          )
        )

      logger.info('Marketplace order cancelled via Payrexx webhook', {
        orderId: order.id,
        reason: status,
      })
      break
    }

    case 'refunded':
    case 'partially-refunded': {
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
    case 'reserved': {
      if (paymentTx.status !== PAYMENT_STATUS.PENDING) {
        logger.info('Payrexx webhook: payment transaction not pending, skipping', {
          transactionId: paymentTx.id,
          currentStatus: paymentTx.status,
        })
        return
      }

      await db
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
        await db
          .update(workshopRegistrations)
          .set({
            paymentStatus: 'paid',
            status: 'confirmed',
            confirmedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(workshopRegistrations.id, paymentTx.workshopRegistrationId))

        logger.info('Workshop registration confirmed via Payrexx', {
          registrationId: paymentTx.workshopRegistrationId,
          transactionId: paymentTx.id,
        })
      }

      // Update linked service appointment
      if (paymentTx.serviceAppointmentId) {
        await db
          .update(serviceAppointments)
          .set({
            status: APPOINTMENT_STATUS.CONFIRMED,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(serviceAppointments.id, paymentTx.serviceAppointmentId))

        logger.info('Service appointment confirmed via Payrexx payment', {
          appointmentId: paymentTx.serviceAppointmentId,
          transactionId: paymentTx.id,
        })
      }

      break
    }

    case 'cancelled':
    case 'declined': {
      await db
        .update(paymentTransactions)
        .set({
          status: PAYMENT_STATUS.FAILED,
          failureReason: status === 'declined' ? 'Payment declined' : 'Payment cancelled',
          processedAt: sql`CURRENT_TIMESTAMP`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(paymentTransactions.id, paymentTx.id))

      // Revert workshop registration to cancelled
      if (paymentTx.workshopRegistrationId) {
        await db
          .update(workshopRegistrations)
          .set({
            paymentStatus: 'not_required',
            status: WORKSHOP_REGISTRATION_STATUS.CANCELLED,
            cancelledAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(workshopRegistrations.id, paymentTx.workshopRegistrationId))
      }

      // Revert service appointment
      if (paymentTx.serviceAppointmentId) {
        await db
          .update(serviceAppointments)
          .set({
            status: APPOINTMENT_STATUS.CANCELLED,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(eq(serviceAppointments.id, paymentTx.serviceAppointmentId))
      }

      logger.info('Payment transaction failed via Payrexx webhook', {
        transactionId: paymentTx.id,
        reason: status,
      })
      break
    }

    case 'refunded':
    case 'partially-refunded': {
      await db
        .update(paymentTransactions)
        .set({
          status: 'refunded',
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
    method: 'payrexx',
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
