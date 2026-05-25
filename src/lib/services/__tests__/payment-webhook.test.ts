/**
 * Tests for payment-webhook.ts — Payrexx webhook business logic.
 *
 * Mission-relevant: payment webhooks are the single path that confirms
 * a buyer has paid, which triggers order fulfilment, workshop confirmation,
 * and service appointment confirmation. A bug here can mark an unpaid order
 * as paid (revenue loss) or block a paid order from confirming (broken UX).
 *
 * Behaviors locked:
 *   lookupPaymentByReferenceId
 *   - returns { type: 'marketplace', order } when order found
 *   - returns { type: 'payment_transaction', paymentTx } when only TX found
 *   - returns { type: 'not_found' } when neither record exists
 *
 *   handleMarketplacePayment — RESERVED (payment authorized)
 *   - skips when order status is not PENDING_PAYMENT
 *   - updates order to PAID when in PENDING_PAYMENT
 *   - fires email and Kivvi sync as fire-and-forget (do not propagate errors)
 *
 *   handleMarketplacePayment — CONFIRMED
 *   - skips when order status is not PAID or DELIVERED
 *   - updates order to COMPLETED
 *
 *   handleMarketplacePayment — CANCELLED / DECLINED
 *   - skips when order is already COMPLETED
 *   - skips when order is already CANCELLED
 *   - updates order to CANCELLED and restores listing to ACTIVE
 *
 *   handleMarketplacePayment — REFUNDED / PARTIALLY_REFUNDED
 *   - updates order to REFUNDED
 *
 *   handleGenericPayment — RESERVED
 *   - skips when payment transaction is not PENDING
 *   - updates payment transaction to SUCCEEDED
 *   - confirms workshop registration when workshopRegistrationId is set
 *   - confirms service appointment when serviceAppointmentId is set
 *   - does NOT update workshop/appointment when IDs are null
 *
 *   handleGenericPayment — CANCELLED / DECLINED
 *   - updates payment transaction to FAILED
 *   - cancels workshop registration when workshopRegistrationId is set
 *   - cancels service appointment when serviceAppointmentId is set
 *
 *   handleGenericPayment — REFUNDED
 *   - updates payment transaction to REFUNDED
 */

// ---------------------------------------------------------------------------
// Drizzle chainable mock factory
//
// Drizzle's query builder is thenable. The mock chain must:
//   1. Return `this` from every builder method (from, where, innerJoin, limit)
//      so that arbitrarily long chains work without extra configuration.
//   2. Be awaitable — expose `.then/.catch` so `await chain` resolves.
// ---------------------------------------------------------------------------

function makeSelectChain(result: unknown[] = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.then = resolved.then.bind(resolved)
  chain.catch = resolved.catch.bind(resolved)
  chain.finally = resolved.finally.bind(resolved)
  return chain
}

// Update chain: db.update(table).set({}).where(cond)
const mockUpdateWhere = jest.fn().mockResolvedValue([])
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere })
const mockDbUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet })

// Select — configurable per call; default returns empty
const mockDbSelect = jest.fn(() => makeSelectChain([]))

// db.execute — used for raw SQL (e.g. workshop_instances participant
// decrement, which isn't modeled in the Drizzle schema)
const mockDbExecute = jest.fn().mockResolvedValue({ rows: [] })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  marketplaceOrders: { id: 'marketplaceOrders' },
  listings: { id: 'listings' },
  users: { id: 'users' },
  paymentTransactions: { id: 'paymentTransactions' },
  workshopRegistrations: { id: 'workshopRegistrations' },
  serviceAppointments: { id: 'serviceAppointments' },
}))

jest.mock('@/db/schema/inventory', () => ({
  inventoryItems: { id: 'inventoryItems' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: jest.fn().mockReturnValue({ __sql: 'raw' }),
    join: jest.fn().mockReturnValue({ __sql: 'joined' }),
  }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/email/templates/marketplace', () => ({
  orderConfirmationBuyer: jest.fn().mockReturnValue({ subject: 'Order', html: '' }),
  newOrderNotificationSeller: jest.fn().mockReturnValue({ subject: 'New order', html: '' }),
}))

jest.mock('@/lib/kivvi/client', () => ({
  createKivviInvoice: jest.fn().mockResolvedValue({ id: 'kiv-1', number: 'RE-2026-001' }),
  updateKivviDocumentStatus: jest.fn().mockResolvedValue(undefined),
  recordKivviPayment: jest.fn().mockResolvedValue(undefined),
  updateKivviInventoryItem: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/config/marketplace', () => ({
  formatCHF: jest.fn((n: number) => `CHF ${n}`),
  DELIVERY_LABELS: { pickup: 'Abholung', shipping: 'Versand' },
  ORDER_STATUS: {
    PENDING_PAYMENT: 'pending_payment',
    PAID: 'paid',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  },
  LISTING_STATUS: {
    ACTIVE: 'active',
    RESERVED: 'reserved',
    SOLD: 'sold',
  },
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: {
    PENDING: 'pending',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    DISPUTED: 'disputed',
  },
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  PAYREXX_TRANSACTION_STATUS: {
    RESERVED: 'reserved',
    CONFIRMED: 'confirmed',
    REFUNDED: 'refunded',
    PARTIALLY_REFUNDED: 'partially-refunded',
    CANCELLED: 'cancelled',
    DECLINED: 'declined',
    WAITING: 'waiting',
    ERROR: 'error',
  },
}))

jest.mock('@/config/appointment-status', () => ({
  APPOINTMENT_STATUS: {
    PENDING_APPROVAL: 'pending_approval',
    REQUESTED: 'requested',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    WAITLIST: 'waitlist',
    ATTENDED: 'attended',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
  },
  WORKSHOP_PAYMENT_STATUS: {
    NOT_REQUIRED: 'not_required',
    PENDING: 'pending',
    PAID: 'paid',
    REFUNDED: 'refunded',
  },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://app.revamp-it.ch',
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  lookupPaymentByReferenceId,
  handleMarketplacePayment,
  handleGenericPayment,
} from '../payment-webhook'
import { ORDER_STATUS, LISTING_STATUS } from '@/config/marketplace'
import { PAYMENT_STATUS } from '@/config/payment-status'
import { PAYREXX_TRANSACTION_STATUS } from '@/lib/payments/payrexx-client'
import { WORKSHOP_REGISTRATION_STATUS, WORKSHOP_PAYMENT_STATUS } from '@/config/workshop-registration-status'
import { APPOINTMENT_STATUS } from '@/config/appointment-status'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'order-1',
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    listingId: 'listing-1',
    amountChf: '250.00',
    commissionChf: '12.50',
    sellerPayoutChf: '237.50',
    status: ORDER_STATUS.PENDING_PAYMENT,
    deliveryMethod: 'pickup',
    ...overrides,
  }
}

function makePaymentTx(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'tx-1',
    status: PAYMENT_STATUS.PENDING,
    workshopRegistrationId: null,
    serviceAppointmentId: null,
    amountCents: 5000,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUpdateWhere.mockResolvedValue([])
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
  mockDbUpdate.mockReturnValue({ set: mockUpdateSet })
  mockDbSelect.mockImplementation(() => makeSelectChain([]))
  mockDbExecute.mockResolvedValue({ rows: [] })
})

// ============================================================================
// lookupPaymentByReferenceId
// ============================================================================

describe('lookupPaymentByReferenceId', () => {
  it('returns { type: "marketplace", order } when marketplace order found', async () => {
    const order = makeOrder()
    mockDbSelect
      .mockReturnValueOnce(makeSelectChain([order]))  // marketplace order found

    const result = await lookupPaymentByReferenceId('order-1')

    expect(result.type).toBe('marketplace')
    expect(result.order).toMatchObject({ id: 'order-1' })
  })

  it('returns { type: "payment_transaction", paymentTx } when no order but TX found', async () => {
    const tx = makePaymentTx()
    mockDbSelect
      .mockReturnValueOnce(makeSelectChain([]))   // no marketplace order
      .mockReturnValueOnce(makeSelectChain([tx])) // payment transaction found

    const result = await lookupPaymentByReferenceId('tx-1')

    expect(result.type).toBe('payment_transaction')
    expect(result.paymentTx).toMatchObject({ id: 'tx-1' })
  })

  it('returns { type: "not_found" } when neither record exists', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeSelectChain([]))  // no order
      .mockReturnValueOnce(makeSelectChain([]))  // no tx

    const result = await lookupPaymentByReferenceId('unknown-ref')

    expect(result.type).toBe('not_found')
  })
})

// ============================================================================
// handleMarketplacePayment — RESERVED
// ============================================================================

describe('handleMarketplacePayment — RESERVED', () => {
  it('skips update when order status is not PENDING_PAYMENT', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc')

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to PAID when status is PENDING_PAYMENT', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc')

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.PAID }),
    )
  })

  it('stores payrexxTransactionId on the order', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-xyz')

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ payrexxTransactionId: 'tx-xyz' }),
    )
  })

  it('does not throw when fire-and-forget email fails', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })
    const { sendCustomEmail } = jest.requireMock('@/lib/email')
    sendCustomEmail.mockRejectedValueOnce(new Error('SMTP down'))

    await expect(
      handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, null),
    ).resolves.not.toThrow()
  })
})

// ============================================================================
// handleMarketplacePayment — CONFIRMED
// ============================================================================

describe('handleMarketplacePayment — CONFIRMED', () => {
  it('skips update when order status is not PAID or DELIVERED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null)

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to COMPLETED when status is PAID', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.COMPLETED }),
    )
  })

  it('updates order to COMPLETED when status is DELIVERED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.DELIVERED })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.COMPLETED }),
    )
  })
})

// ============================================================================
// handleMarketplacePayment — CANCELLED / DECLINED
// ============================================================================

describe('handleMarketplacePayment — CANCELLED / DECLINED', () => {
  it('skips when order is already COMPLETED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.COMPLETED })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('skips when order is already CANCELLED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.CANCELLED })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.DECLINED, null)

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to CANCELLED for CANCELLED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    expect(mockDbUpdate).toHaveBeenCalledWith(expect.anything()) // marketplaceOrders
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    )
  })

  it('also restores listing to ACTIVE on CANCELLED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID, listingId: 'lst-1' })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    // Two db.update calls: order + listing
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    // Second call updates the listing
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: LISTING_STATUS.ACTIVE }),
    )
  })

  it('updates order to CANCELLED for DECLINED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.DECLINED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    )
  })
})

// ============================================================================
// handleMarketplacePayment — REFUNDED / PARTIALLY_REFUNDED
// ============================================================================

describe('handleMarketplacePayment — REFUNDED / PARTIALLY_REFUNDED', () => {
  it('updates order to REFUNDED on REFUNDED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.REFUNDED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.REFUNDED }),
    )
  })

  it('updates order to REFUNDED on PARTIALLY_REFUNDED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.REFUNDED }),
    )
  })
})

// ============================================================================
// handleGenericPayment — RESERVED
// ============================================================================

describe('handleGenericPayment — RESERVED', () => {
  it('skips update when payment transaction is not PENDING', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.SUCCEEDED })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1')

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates payment transaction to SUCCEEDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1')

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.SUCCEEDED }),
    )
  })

  it('confirms workshop registration when workshopRegistrationId is set', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: 'reg-1' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null)

    // Two updates: payment transaction + workshop registration
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: WORKSHOP_PAYMENT_STATUS.PAID,
        status: WORKSHOP_REGISTRATION_STATUS.CONFIRMED,
      }),
    )
  })

  it('confirms service appointment when serviceAppointmentId is set', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, serviceAppointmentId: 'appt-1' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null)

    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: APPOINTMENT_STATUS.CONFIRMED }),
    )
  })

  it('does NOT update workshop/appointment when IDs are null', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: null, serviceAppointmentId: null })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null)

    // Only one update: the payment transaction itself
    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// handleGenericPayment — CANCELLED / DECLINED
// ============================================================================

describe('handleGenericPayment — CANCELLED / DECLINED', () => {
  it('updates payment transaction to FAILED on CANCELLED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.FAILED }),
    )
  })

  it('updates payment transaction to FAILED on DECLINED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.FAILED }),
    )
  })

  it('cancels workshop registration when workshopRegistrationId is set', async () => {
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-2' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: WORKSHOP_REGISTRATION_STATUS.CANCELLED }),
    )
  })

  it('decrements workshop_instances.current_participants on payment failure so phantom count from register-with-payment is undone', async () => {
    // The register-with-payment route increments current_participants when
    // the registration is INSERTed (before payment completes). Without
    // decrementing here on payment failure, the count leaks +1 per failed
    // payment and the capacity check eventually blocks legit users.
    // (The sql mock in this file collapses template-literals to a
    // {__sql:'mocked'} placeholder, so we can only assert that the raw-
    // SQL path was taken via db.execute — the inline GREATEST(...) clamp
    // is enforced by direct read of the route source.)
    mockDbSelect.mockImplementationOnce(() => makeSelectChain([{ workshopInstanceId: 'inst-99' }]))
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-99' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null)

    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('skips the participant decrement when the registration row is missing (idempotent on duplicate webhook)', async () => {
    // select returns empty (registration already gone / never existed)
    mockDbSelect.mockImplementation(() => makeSelectChain([]))
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-missing' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null)

    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('cancels service appointment when serviceAppointmentId is set', async () => {
    const tx = makePaymentTx({ serviceAppointmentId: 'appt-2' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: APPOINTMENT_STATUS.CANCELLED }),
    )
  })
})

// ============================================================================
// handleGenericPayment — REFUNDED
// ============================================================================

describe('handleGenericPayment — REFUNDED', () => {
  it('updates payment transaction to REFUNDED on REFUNDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.SUCCEEDED })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.REFUNDED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.REFUNDED }),
    )
  })

  it('updates payment transaction to REFUNDED on PARTIALLY_REFUNDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.SUCCEEDED })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED, null)

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.REFUNDED }),
    )
  })
})
