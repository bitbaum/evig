/**
 * Payment Webhook Service
 *
 * Business logic for processing Payrexx payment webhook callbacks.
 * Handles marketplace orders, workshop registrations, and service appointments.
 */

import { db } from '@/db'
import { marketplaceOrders, marketplaceOrderItems, listings, users, paymentTransactions, workshopRegistrations, serviceAppointments } from '@/db/schema'
import { inventoryItems } from '@/db/schema/inventory'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import {
  orderConfirmationBuyer,
  newOrderNotificationSeller,
} from '@/lib/email/templates/marketplace'
import { formatCHF, DELIVERY_LABELS, ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { PAYREXX_TRANSACTION_STATUS, captureTransaction } from '@/lib/payments/payrexx-client'
import { BOOKING_STATUS } from '@/config/booking-status'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_PAYMENT_STATUS } from '@/config/workshop-registration-status'
import { APP_URL } from '@/config/urls'
import type { DeliveryOption } from '@/config/marketplace'
import {
  createKivviInvoice,
  updateKivviDocumentStatus,
  recordKivviPayment,
  updateKivviInventoryItem,
  recordKivviAgencySale,
  recordKivviPayout,
} from '@/lib/kivvi/client'
import { triggerInviterReward } from '@/lib/referral'

// ============================================================================
// Types
// ============================================================================

interface MarketplaceOrder {
  id: string
  buyerId: string
  sellerId: string
  listingId: string | null
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
  /** Set only for escrow payments (auto-release date). Null/absent → non-escrow,
   *  which must be captured immediately on the reserved webhook (a reservation
   *  otherwise expires uncaptured in ~7 days and the funds are never collected).
   *  The runtime lookup always selects it; optional only so unrelated test
   *  fixtures (which exercise non-escrow paths) need not specify it. */
  escrowReleaseDate?: string | null
}

/** Result from looking up a payment record by referenceId */
export interface PaymentLookupResult {
  type: 'marketplace' | 'payment_transaction' | 'not_found'
  order?: MarketplaceOrder
  paymentTx?: PaymentTransaction
}

/**
 * Webhook amount + currency claimed by Payrexx. We verify these against the
 * expected order/transaction values before any state transition — a valid
 * HMAC signature alone is not enough (replay from a smaller transaction or
 * test-instance bleed would still flip orders to PAID).
 *
 * Payrexx amounts are denominated in the currency's smallest unit (Rappen for
 * CHF — see PaymentRequestParams.amount in @/lib/payments/payrexx-client).
 */
export interface WebhookAmountClaim {
  /** Amount in smallest unit (e.g. Rappen for CHF). null if Payrexx omitted it. */
  amount: number | null
  /** ISO 4217 code (e.g. "CHF"). null if Payrexx omitted it. */
  currency: string | null
}

const EXPECTED_CURRENCY = 'CHF'

/**
 * Marketplace orders price in CHF (decimal string like "150.00"). Convert to
 * cents and compare against the webhook claim. Returns true on match, false
 * on mismatch — callers MUST refuse to advance state when false.
 */
function verifyMarketplaceAmount(order: MarketplaceOrder, claim: WebhookAmountClaim): boolean {
  // Statuses that don't move money (CANCELLED, DECLINED, REFUNDED) sometimes
  // arrive with amount=0 or null. Amount verification only matters when we're
  // about to flip the order to PAID/COMPLETED. The caller chooses when to call.
  if (claim.amount === null || claim.currency === null) return false
  if (claim.currency !== EXPECTED_CURRENCY) return false

  const expectedCents = Math.round(parseFloat(order.amountChf) * 100)
  // parseFloat would silently return NaN on a bad string — guard explicitly
  // so a corrupted row never lets a mismatched webhook through.
  if (!Number.isFinite(expectedCents) || expectedCents <= 0) return false

  return claim.amount === expectedCents
}

/**
 * Payment transactions store amount as cents directly. Direct equality after
 * currency check.
 */
function verifyTransactionAmount(paymentTx: PaymentTransaction, claim: WebhookAmountClaim): boolean {
  if (claim.amount === null || claim.currency === null) return false
  if (claim.currency !== EXPECTED_CURRENCY) return false
  if (paymentTx.amountCents <= 0) return false
  return claim.amount === paymentTx.amountCents
}

// ============================================================================
// Lookup
// ============================================================================

/** Find the payment record matching a Payrexx referenceId */
export async function lookupPaymentByReferenceId(referenceId: string): Promise<PaymentLookupResult> {
  // Try marketplace order first
  const orderRows = await db
    .select()
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
      escrowReleaseDate: paymentTransactions.escrowReleaseDate,
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
 *
 * `amountClaim` is the amount + currency Payrexx reports in the webhook
 * payload. We verify it against the order before any money-moving state
 * transition (RESERVED → PAID, CONFIRMED → COMPLETED). A valid HMAC is not
 * sufficient — without amount verification a signed-but-replayed webhook
 * from a smaller transaction would flip the order to PAID.
 */
export async function handleMarketplacePayment(
  order: MarketplaceOrder,
  status: string,
  transactionId: string | null,
  amountClaim: WebhookAmountClaim
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

      if (!verifyMarketplaceAmount(order, amountClaim)) {
        logger.error('Payrexx webhook: amount/currency mismatch on RESERVED, refusing to mark paid', {
          orderId: order.id,
          expectedChf: order.amountChf,
          claimedAmount: amountClaim.amount,
          claimedCurrency: amountClaim.currency,
          transactionId,
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

      // Fire-and-forget Kivvi accounting sync (owned stock → invoice; P2P → agency journal)
      syncMarketplaceOrderToKivvi(order, transactionId).catch(err =>
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

      if (!verifyMarketplaceAmount(order, amountClaim)) {
        logger.error('Payrexx webhook: amount/currency mismatch on CONFIRMED, refusing to mark completed', {
          orderId: order.id,
          expectedChf: order.amountChf,
          claimedAmount: amountClaim.amount,
          claimedCurrency: amountClaim.currency,
          transactionId,
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

      syncP2PPayoutToKivvi(order).catch(err =>
        logger.error('Kivvi payout sync failed — order completed but seller payable not cleared', {
          error: err,
          orderId: order.id,
        })
      )
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

        // Restore the reserved listing(s) to active. Single-item orders carry
        // listingId; cart orders restore every item via marketplace_order_items.
        if (order.listingId) {
          await tx
            .update(listings)
            .set({ status: LISTING_STATUS.ACTIVE })
            .where(and(eq(listings.id, order.listingId), eq(listings.status, LISTING_STATUS.RESERVED)))
        } else {
          const items = await tx
            .select({ listingId: marketplaceOrderItems.listingId })
            .from(marketplaceOrderItems)
            .where(eq(marketplaceOrderItems.orderId, order.id))
          if (items.length > 0) {
            await tx
              .update(listings)
              .set({ status: LISTING_STATUS.ACTIVE })
              .where(and(inArray(listings.id, items.map((i) => i.listingId)), eq(listings.status, LISTING_STATUS.RESERVED)))
          }
        }
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
 *
 * `amountClaim` is verified against paymentTx.amountCents before any
 * money-moving state transition. See handleMarketplacePayment for the
 * full rationale.
 */
export async function handleGenericPayment(
  paymentTx: PaymentTransaction,
  status: string,
  payrexxTransactionId: string | null,
  amountClaim: WebhookAmountClaim
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

      if (!verifyTransactionAmount(paymentTx, amountClaim)) {
        logger.error('Payrexx webhook: amount/currency mismatch on RESERVED, refusing to mark succeeded', {
          transactionId: paymentTx.id,
          expectedCents: paymentTx.amountCents,
          claimedAmount: amountClaim.amount,
          claimedCurrency: amountClaim.currency,
          payrexxTransactionId,
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
              status: BOOKING_STATUS.IN_PROGRESS,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            })
            .where(eq(serviceAppointments.id, paymentTx.serviceAppointmentId))
        }
      })

      // Non-escrow payments (workshops, appointments) authorize-then-capture in
      // one step: the gateway only RESERVES funds, so we must capture now or the
      // hold expires uncaptured (~7 days) and Revamp-IT never receives the money.
      // Escrow payments stay held and are captured by the escrow-release route.
      // Capture after the state commit so a Payrexx hiccup never locks the user
      // out of what they paid for — a failure is loud-logged for manual capture.
      if (!paymentTx.escrowReleaseDate && payrexxTransactionId) {
        try {
          await captureTransaction(payrexxTransactionId, paymentTx.amountCents)
          logger.info('Non-escrow payment captured', {
            transactionId: paymentTx.id,
            payrexxTransactionId,
          })
        } catch (captureError) {
          logger.error('Non-escrow capture FAILED — funds reserved but not captured; capture manually within 7 days', {
            transactionId: paymentTx.id,
            payrexxTransactionId,
            amountCents: paymentTx.amountCents,
            error: captureError instanceof Error ? captureError.message : String(captureError),
          })
        }
      }

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
              status: BOOKING_STATUS.QUOTE_APPROVED,
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
/**
 * Current Swiss standard MWST rate (8.1% since 2024-01-01), as the string Kivvi
 * expects. Marketplace prices are charged VAT-INCLUSIVE (gross), but Kivvi
 * treats `unitPrice` as NET and adds VAT on top — so we must convert to net
 * before sending (see grossToNetChf), otherwise the invoice total is inflated by
 * the VAT rate and never matches the recorded payment.
 *
 * NOTE (SSOT follow-up): the app also carries a stale VAT_RATE_CHF (7.7%) in
 * src/lib/pricing and a duplicate in src/lib/payments/currency.ts. The VAT-rate
 * source of truth should be consolidated to one place at the correct 8.1%.
 */
export const KIVVI_MWST_RATE = '8.1'

/**
 * Convert a VAT-inclusive (gross) CHF amount to the net amount, so that Kivvi's
 * `net + VAT` reconstructs the original gross that the customer actually paid.
 * Returns a 2-decimal string. Falls back to the input on unparseable values.
 */
export function grossToNetChf(grossChf: string, ratePercent: string = KIVVI_MWST_RATE): string {
  const gross = parseFloat(grossChf)
  const rate = parseFloat(ratePercent)
  if (!Number.isFinite(gross) || !Number.isFinite(rate)) return grossChf
  return (gross / (1 + rate / 100)).toFixed(2)
}

/**
 * True only when every listing behind the order is revamp-it-OWNED stock
 * (isRevampit=true). Single-item orders carry `order.listingId`; cart orders
 * resolve their listings via marketplace_order_items. The cart checkout rejects
 * P2P listings, so a cart order is all-owned by construction — but we still
 * verify every line so a future mixed order can never leak a P2P amount into
 * the general ledger. isRevampit on the listing is the SSOT (see
 * db/schema/marketplace.ts) — ownership is NEVER re-derived from seller email.
 */
async function isRevampitOwnedOrder(order: MarketplaceOrder): Promise<boolean> {
  if (order.listingId) {
    const [row] = await db
      .select({ isRevampit: listings.isRevampit })
      .from(listings)
      .where(eq(listings.id, order.listingId))
      .limit(1)
    return Boolean(row?.isRevampit)
  }
  const rows = await db
    .select({ isRevampit: listings.isRevampit })
    .from(marketplaceOrderItems)
    .innerJoin(listings, eq(marketplaceOrderItems.listingId, listings.id))
    .where(eq(marketplaceOrderItems.orderId, order.id))
  return rows.length > 0 && rows.every((r) => Boolean(r.isRevampit))
}

async function syncMarketplaceOrderToKivvi(
  order: MarketplaceOrder,
  payrexxTransactionId: string | null,
): Promise<void> {
  if (await isRevampitOwnedOrder(order)) {
    return syncOrderToKivvi(order, payrexxTransactionId)
  }
  return syncP2POrderToKivvi(order, payrexxTransactionId)
}

/** VAT on platform commission fee only (Swiss 8.1%). Zero when commission is 0. */
function computeCommissionVatAmount(commissionNetChf: string): string {
  const net = Number(commissionNetChf || 0)
  if (!Number.isFinite(net) || net <= 0) return '0.00'
  return (Math.round(net * 0.081 * 100) / 100).toFixed(2)
}

function formatChfAmount(value: string | number): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '0.00'
  return n.toFixed(2)
}

/**
 * P2P agency booking — pass-through liability + optional commission.
 * Per Kivvi SYSTEM_DESIGN.md §3.4. No invoice, no inventory mark-sold.
 */
async function syncP2POrderToKivvi(
  order: MarketplaceOrder,
  payrexxTransactionId: string | null,
): Promise<void> {
  const commissionAmount = formatChfAmount(order.commissionChf)
  const commissionVatAmount = computeCommissionVatAmount(commissionAmount)
  const sellerPayout = formatChfAmount(order.sellerPayoutChf)
  const grossAmount = formatChfAmount(order.amountChf)

  await recordKivviAgencySale(
    {
      orderReference: `MO-${order.id}`,
      date: new Date().toISOString().split('T')[0],
      grossAmount,
      commissionAmount,
      commissionVatAmount,
      sellerPayout,
      sourceId: order.id,
      description: payrexxTransactionId
        ? `P2P sale MO-${order.id} Payrexx ${payrexxTransactionId}`
        : `P2P sale MO-${order.id}`,
    },
    `marketplace-order:${order.id}:paid`,
  )

  logger.info('Kivvi P2P agency sale booked', {
    orderId: order.id,
    grossAmount,
    commissionAmount,
    sellerPayout,
  })
}

/**
 * Clear seller payable when escrow is released (Payrexx CONFIRMED → COMPLETED).
 * Owned-stock orders skip — no 2140 liability was created at payment time.
 */
async function syncP2PPayoutToKivvi(order: MarketplaceOrder): Promise<void> {
  if (await isRevampitOwnedOrder(order)) {
    return
  }

  const sellerPayout = formatChfAmount(order.sellerPayoutChf)
  if (Number(sellerPayout) <= 0) {
    return
  }

  await recordKivviPayout(
    {
      amount: sellerPayout,
      date: new Date().toISOString().split('T')[0],
      reference: `MO-${order.id}`,
      description: `P2P seller payout MO-${order.id}`,
    },
    `marketplace-order:${order.id}:payout`,
  )

  logger.info('Kivvi P2P seller payout booked', {
    orderId: order.id,
    amount: sellerPayout,
  })
}

async function syncOrderToKivvi(
  order: MarketplaceOrder,
  payrexxTransactionId: string | null,
): Promise<void> {
  // Buyer info is always present (no listing dependency).
  const [buyer] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, order.buyerId))
    .limit(1)

  // Resolve the Kivvi inventory item id behind a listing (if it's backed by one).
  const resolveKivviItemId = async (listingInventoryItemId: string | null): Promise<string | undefined> => {
    if (!listingInventoryItemId) return undefined
    const [row] = await db
      .select({ kivviInventoryItemId: inventoryItems.kivviInventoryItemId })
      .from(inventoryItems)
      .where(eq(inventoryItems.id, listingInventoryItemId))
      .limit(1)
    return row?.kivviInventoryItemId ?? undefined
  }

  // 1. Build invoice line items. Single-item orders → one line priced at the
  // full order amount (includes any shipping). Cart orders → one line per
  // order item, each at its unit price.
  const invoiceItems: { description: string; quantity: string; unitPrice: string; vatRate: string; kivviInventoryItemId?: string }[] = []
  const kivviItemIdsToMarkSold: string[] = []

  if (order.listingId) {
    const [info] = await db
      .select({ title: listings.title, inventoryItemId: listings.inventoryItemId })
      .from(listings)
      .where(eq(listings.id, order.listingId))
      .limit(1)
    if (!info) {
      logger.warn('Kivvi sync: could not fetch listing for order', { orderId: order.id })
      return
    }
    const kivviItemId = await resolveKivviItemId(info.inventoryItemId)
    if (kivviItemId) kivviItemIdsToMarkSold.push(kivviItemId)
    invoiceItems.push({
      description: info.title,
      quantity: '1',
      // Gross (VAT-incl.) amount charged → net, so Kivvi's net+VAT == amount paid.
      unitPrice: grossToNetChf(order.amountChf),
      vatRate: KIVVI_MWST_RATE,
      kivviInventoryItemId: kivviItemId,
    })
  } else {
    const items = await db
      .select({
        title: marketplaceOrderItems.title,
        unitPriceChf: marketplaceOrderItems.unitPriceChf,
        quantity: marketplaceOrderItems.quantity,
        inventoryItemId: listings.inventoryItemId,
      })
      .from(marketplaceOrderItems)
      .leftJoin(listings, eq(marketplaceOrderItems.listingId, listings.id))
      .where(eq(marketplaceOrderItems.orderId, order.id))
      .orderBy(marketplaceOrderItems.createdAt)
    if (items.length === 0) {
      logger.warn('Kivvi sync: cart order has no items', { orderId: order.id })
      return
    }
    for (const it of items) {
      const kivviItemId = await resolveKivviItemId(it.inventoryItemId)
      if (kivviItemId) kivviItemIdsToMarkSold.push(kivviItemId)
      invoiceItems.push({
        description: it.title,
        quantity: String(it.quantity),
        // Per-unit gross (VAT-incl.) → net; Kivvi computes net·qty + VAT.
        unitPrice: grossToNetChf(it.unitPriceChf),
        vatRate: KIVVI_MWST_RATE,
        kivviInventoryItemId: kivviItemId,
      })
    }
  }

  // 2. Create Kivvi invoice
  const invoice = await createKivviInvoice({
    contactName: buyer?.name || 'Unbekannter Käufer',
    contactEmail: buyer?.email || undefined,
    items: invoiceItems,
    notes: payrexxTransactionId
      ? `Payrexx Transaktion: ${payrexxTransactionId}`
      : undefined,
  })

  logger.info('Kivvi invoice created for marketplace order', {
    orderId: order.id,
    kivviDocumentId: invoice.id,
    invoiceNumber: invoice.number,
    lineItems: invoiceItems.length,
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

  // 5. Mark each backing Kivvi inventory item as sold (fire-and-forget, best effort)
  for (const kivviItemId of kivviItemIdsToMarkSold) {
    updateKivviInventoryItem(kivviItemId, { status: 'sold' }).catch(err =>
      logger.warn('Kivvi: failed to mark inventory item sold', {
        kivviInventoryItemId: kivviItemId,
        error: err,
      })
    )
  }
}

// ============================================================================
// Email notifications
// ============================================================================

/**
 * Resolve a human display title for an order. Single-item orders use the
 * listing title; cart orders (listingId null) summarise their line items as
 * "First item +N weitere".
 */
async function resolveOrderTitle(orderId: string, listingId: string | null): Promise<string | null> {
  if (listingId) {
    const [l] = await db.select({ title: listings.title }).from(listings).where(eq(listings.id, listingId))
    return l?.title ?? null
  }
  const items = await db
    .select({ title: marketplaceOrderItems.title })
    .from(marketplaceOrderItems)
    .where(eq(marketplaceOrderItems.orderId, orderId))
    .orderBy(marketplaceOrderItems.createdAt)
  if (items.length === 0) return null
  return items.length === 1 ? items[0].title : `${items[0].title} +${items.length - 1} weitere Artikel`
}

async function sendOrderEmails(order: {
  id: string
  buyerId: string
  sellerId: string
  // null for multi-item cart orders — title is then summarised from order items.
  listingId: string | null
  amountChf: string
  commissionChf: string
  sellerPayoutChf: string
  deliveryMethod: string
}) {
  const orderUrl = `${APP_URL}/dashboard/orders/${order.id}`
  const deliveryLabel = DELIVERY_LABELS[order.deliveryMethod as DeliveryOption] || order.deliveryMethod

  const title = await resolveOrderTitle(order.id, order.listingId)
  if (!title) {
    logger.warn('Order email skipped: could not resolve title', { orderId: order.id })
    return
  }

  // Buyer + seller looked up directly (no listing join — cart orders have none).
  const [buyerInfo] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, order.buyerId))

  const [sellerInfo] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, order.sellerId))

  // Buyer confirmation
  if (buyerInfo?.email) {
    await sendCustomEmail(
      buyerInfo.email,
      orderConfirmationBuyer({
        recipientName: buyerInfo.name || 'Käufer',
        listingTitle: title,
        amountChf: formatCHF(Number(order.amountChf)),
        commissionChf: formatCHF(Number(order.commissionChf)),
        deliveryMethod: deliveryLabel,
        orderUrl,
      })
    )
  }

  // Seller notification
  if (sellerInfo?.email) {
    await sendCustomEmail(
      sellerInfo.email,
      newOrderNotificationSeller({
        recipientName: sellerInfo.name || 'Verkäufer',
        buyerName: buyerInfo?.name || 'Käufer',
        listingTitle: title,
        payoutAmountChf: formatCHF(Number(order.sellerPayoutChf)),
        deliveryMethod: deliveryLabel,
        orderUrl,
      })
    )
  }
}
