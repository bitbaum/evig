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
 *   - moves service appointment to IN_PROGRESS when serviceAppointmentId is set
 *     (a paid, quote-approved booking starts the repair — see booking-status.ts)
 *   - does NOT update workshop/appointment when IDs are null
 *
 *   handleGenericPayment — CANCELLED / DECLINED
 *   - updates payment transaction to FAILED
 *   - cancels workshop registration when workshopRegistrationId is set
 *   - reverts service appointment to QUOTE_APPROVED when serviceAppointmentId is
 *     set (pre-payment payable state, so the customer can retry — not a dead end)
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

// db.transaction(callback) — payment webhooks now wrap multi-write
// branches in a transaction. Default impl invokes the callback with a tx
// object whose select/update/execute methods route through the existing
// outer mocks, so the same mock chain (mockDbUpdate / mockDbSelect /
// mockDbExecute) drives both the per-statement test assertions AND the
// transactional payment-webhook flow.
const mockDbTransaction = jest.fn().mockImplementation(
  async (fn: (tx: unknown) => Promise<unknown>) => fn({
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  })
)

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
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

// NOTE: service appointments follow the BOOKING_STATUS lifecycle
// (requested → … → quote_approved → in_progress → completed), NOT the legacy
// APPOINTMENT_STATUS model. The module under test imports @/config/booking-status
// directly; we use the real (unmocked) config here so assertions track the SSOT.

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
import { BOOKING_STATUS } from '@/config/booking-status'

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
  // jest.clearAllMocks wipes mockDbTransaction's default impl too — restore
  // it so the transactional payment-webhook flow continues to work for
  // tests that don't customize it.
  mockDbTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({
      select: (...args: unknown[]) => mockDbSelect.apply(null, args),
      update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
      execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    })
  )
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

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc', { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to PAID when status is PENDING_PAYMENT', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc', { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.PAID }),
    )
  })

  it('stores payrexxTransactionId on the order', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-xyz', { amount: 25000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ payrexxTransactionId: 'tx-xyz' }),
    )
  })

  it('does not throw when fire-and-forget email fails', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })
    const { sendCustomEmail } = jest.requireMock('@/lib/email')
    sendCustomEmail.mockRejectedValueOnce(new Error('SMTP down'))

    await expect(
      handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, null, { amount: 25000, currency: 'CHF' }),
    ).resolves.not.toThrow()
  })

  // Amount-claim verification — a signed-but-replayed webhook from a smaller
  // transaction would otherwise be accepted. Each mismatched-claim case must
  // refuse to advance the order's state.
  it('refuses to mark paid when claimed amount does not match order amount', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc', { amount: 100, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('refuses to mark paid when claimed currency is wrong', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc', { amount: 25000, currency: 'EUR' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('refuses to mark paid when claim amount is missing', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.RESERVED, 'tx-abc', { amount: null, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })
})

// ============================================================================
// handleMarketplacePayment — CONFIRMED
// ============================================================================

describe('handleMarketplacePayment — CONFIRMED', () => {
  it('skips update when order status is not PAID or DELIVERED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null, { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to COMPLETED when status is PAID', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null, { amount: 25000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.COMPLETED }),
    )
  })

  it('updates order to COMPLETED when status is DELIVERED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.DELIVERED })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CONFIRMED, null, { amount: 25000, currency: 'CHF' })

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

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('skips when order is already CANCELLED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.CANCELLED })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.DECLINED, null, { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates order to CANCELLED for CANCELLED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PENDING_PAYMENT })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 25000, currency: 'CHF' })

    expect(mockDbUpdate).toHaveBeenCalledWith(expect.anything()) // marketplaceOrders
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    )
  })

  it('also restores listing to ACTIVE on CANCELLED', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID, listingId: 'lst-1' })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 25000, currency: 'CHF' })

    // Two db.update calls: order + listing
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    // Second call updates the listing
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: LISTING_STATUS.ACTIVE }),
    )
  })

  it('updates order to CANCELLED for DECLINED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.DECLINED, null, { amount: 25000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.CANCELLED }),
    )
  })

  it('wraps the order cancellation + listing restore in a single transaction', async () => {
    // Without the transaction, a failure on the listings restore after the
    // order was already CANCELLED leaves the listing in RESERVED forever
    // (permanently locked: can't be bought by anyone else, can't be
    // re-listed). Regression: assert db.transaction is invoked and both
    // writes run through the tx wrapper, so postgres rolls back if either
    // half fails.
    const order = makeOrder({ status: ORDER_STATUS.PAID, listingId: 'lst-1' })
    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 25000, currency: 'CHF' })

    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    // Both updates happen inside the transaction callback (which routes
    // tx.update through mockDbUpdate via the default impl).
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
  })

  it('surfaces a transaction failure rather than silently committing the partial state', async () => {
    // Simulate: order update inside the transaction commits OK, listings
    // restore throws. The transaction must reject — postgres rolls back
    // the order update — and the throw bubbles out of handleMarketplacePayment.
    mockDbTransaction.mockImplementationOnce(async () => {
      throw new Error('FK contention on listings restore')
    })
    const order = makeOrder({ status: ORDER_STATUS.PAID, listingId: 'lst-1' })

    await expect(
      handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 25000, currency: 'CHF' }),
    ).rejects.toThrow('FK contention')
  })
})

// ============================================================================
// handleMarketplacePayment — REFUNDED / PARTIALLY_REFUNDED
// ============================================================================

describe('handleMarketplacePayment — REFUNDED / PARTIALLY_REFUNDED', () => {
  it('updates order to REFUNDED on REFUNDED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.REFUNDED, null, { amount: 25000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: ORDER_STATUS.REFUNDED }),
    )
  })

  it('updates order to REFUNDED on PARTIALLY_REFUNDED status', async () => {
    const order = makeOrder({ status: ORDER_STATUS.PAID })

    await handleMarketplacePayment(order, PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED, null, { amount: 25000, currency: 'CHF' })

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

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 5000, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates payment transaction to SUCCEEDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.SUCCEEDED }),
    )
  })

  it('confirms workshop registration when workshopRegistrationId is set', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: 'reg-1' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null, { amount: 5000, currency: 'CHF' })

    // Two updates: payment transaction + workshop registration
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentStatus: WORKSHOP_PAYMENT_STATUS.PAID,
        status: WORKSHOP_REGISTRATION_STATUS.CONFIRMED,
      }),
    )
  })

  it('moves service appointment to IN_PROGRESS when serviceAppointmentId is set', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, serviceAppointmentId: 'appt-1' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null, { amount: 5000, currency: 'CHF' })

    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: BOOKING_STATUS.IN_PROGRESS }),
    )
  })

  it('does NOT update workshop/appointment when IDs are null', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: null, serviceAppointmentId: null })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, null, { amount: 5000, currency: 'CHF' })

    // Only one update: the payment transaction itself
    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })

  // Amount-claim verification for payment transactions — same threat model
  // as marketplace: a signed-but-replayed webhook from a smaller transaction
  // would otherwise flip workshop registrations / appointments to confirmed
  // without the user actually paying that amount.
  it('refuses to mark succeeded when claimed amount does not match transaction amount', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 100, currency: 'CHF' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
    expect(mockDbTransaction).not.toHaveBeenCalled()
  })

  it('refuses to mark succeeded when claimed currency is wrong', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 5000, currency: 'EUR' })

    expect(mockDbUpdate).not.toHaveBeenCalled()
    expect(mockDbTransaction).not.toHaveBeenCalled()
  })

  it('wraps payment + workshop confirmation in a single transaction (highest-impact gap)', async () => {
    // Without the transaction, payment can be marked SUCCEEDED while the
    // workshop registration update fails — leaving the user PAID but
    // their registration still PENDING. They've paid real money and the
    // platform shows the spot as unconfirmed. The next webhook retry
    // doesn't recover because the early-return at
    // `paymentTx.status !== PENDING` skips the whole block. Regression:
    // assert both writes happen inside one db.transaction.
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: 'reg-1' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 5000, currency: 'CHF' })

    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    // Both updates happen via tx.update routed through mockDbUpdate.
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
  })

  it('throws when the transaction rejects so a partial-state commit cannot happen', async () => {
    mockDbTransaction.mockImplementationOnce(async () => {
      throw new Error('workshop registration update failed')
    })
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING, workshopRegistrationId: 'reg-1' })

    await expect(
      handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.RESERVED, 'payrexx-1', { amount: 5000, currency: 'CHF' }),
    ).rejects.toThrow('workshop registration update failed')
  })
})

// ============================================================================
// handleGenericPayment — CANCELLED / DECLINED
// ============================================================================

describe('handleGenericPayment — CANCELLED / DECLINED', () => {
  it('updates payment transaction to FAILED on CANCELLED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.FAILED }),
    )
  })

  it('updates payment transaction to FAILED on DECLINED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.PENDING })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null, { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.FAILED }),
    )
  })

  it('cancels workshop registration when workshopRegistrationId is set', async () => {
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-2' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 5000, currency: 'CHF' })

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

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null, { amount: 5000, currency: 'CHF' })

    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('skips the participant decrement when the registration row is missing (idempotent on duplicate webhook)', async () => {
    // select returns empty (registration already gone / never existed)
    mockDbSelect.mockImplementation(() => makeSelectChain([]))
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-missing' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 5000, currency: 'CHF' })

    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('reverts service appointment to QUOTE_APPROVED when serviceAppointmentId is set', async () => {
    const tx = makePaymentTx({ serviceAppointmentId: 'appt-2' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.DECLINED, null, { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: BOOKING_STATUS.QUOTE_APPROVED }),
    )
  })

  it('wraps the FAILED + revert + participant-decrement in a single transaction', async () => {
    // Critical: without the transaction, a failure on the
    // participant-count decrement after the registration was already
    // CANCELLED leaves a phantom +1 on workshop_instances.current_participants.
    // Over many failed payments the capacity check blocks legitimate
    // users from a workshop that's not actually full. Regression: assert
    // db.transaction is invoked and all three writes route through it.
    mockDbSelect.mockImplementationOnce(() => makeSelectChain([{ workshopInstanceId: 'inst-99' }]))
    const tx = makePaymentTx({ workshopRegistrationId: 'reg-99' })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.CANCELLED, null, { amount: 5000, currency: 'CHF' })

    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    // Two updates (paymentTx FAILED + registration CANCELLED) routed
    // through tx.update; the participant-count UPDATE goes via tx.execute.
    expect(mockDbUpdate).toHaveBeenCalledTimes(2)
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// handleGenericPayment — REFUNDED
// ============================================================================

describe('handleGenericPayment — REFUNDED', () => {
  it('updates payment transaction to REFUNDED on REFUNDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.SUCCEEDED })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.REFUNDED, null, { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.REFUNDED }),
    )
  })

  it('updates payment transaction to REFUNDED on PARTIALLY_REFUNDED', async () => {
    const tx = makePaymentTx({ status: PAYMENT_STATUS.SUCCEEDED })

    await handleGenericPayment(tx, PAYREXX_TRANSACTION_STATUS.PARTIALLY_REFUNDED, null, { amount: 5000, currency: 'CHF' })

    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: PAYMENT_STATUS.REFUNDED }),
    )
  })
})
