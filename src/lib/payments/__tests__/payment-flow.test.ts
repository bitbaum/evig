/**
 * Tests for payment-flow.ts pure utility functions
 *
 * Tests calculateFees, calculateSwissVAT, buildInvoiceLineItem, centsToDisplay,
 * and the high-level processPayment orchestrator (with mocks).
 *
 * DB-dependent functions (getPaymentProvider, createTransaction, etc.) use
 * Drizzle ORM and need proper Drizzle mocks.
 */

// Mock db — factory runs at hoist time, so define mock inline
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    execute: jest.fn(),
    transaction: jest.fn(),
  },
}))

// Mock drizzle-orm functions
jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args: unknown[]) => args),
  and: jest.fn((...args: unknown[]) => args),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    { raw: (s: string) => s }
  ),
}))

// Mock db/schema
jest.mock('@/db/schema', () => ({
  paymentProviders: {
    id: 'id', slug: 'slug', feePercentage: 'fee_percentage',
    feeFixedCents: 'fee_fixed_cents', isActive: 'is_active',
  },
  paymentTransactions: {
    id: 'id', userId: 'user_id', providerId: 'provider_id',
    providerTransactionId: 'provider_transaction_id',
    amountCents: 'amount_cents', currency: 'currency',
    feeCents: 'fee_cents', netAmountCents: 'net_amount_cents',
    serviceAppointmentId: 'service_appointment_id',
    workshopRegistrationId: 'workshop_registration_id',
    status: 'status', type: 'type', description: 'description',
    escrowReleaseDate: 'escrow_release_date', metadata: 'metadata',
  },
  escrowAccounts: {
    transactionId: 'transaction_id', totalAmountCents: 'total_amount_cents',
    currency: 'currency', autoReleaseDays: 'auto_release_days',
    releaseDeadline: 'release_deadline', buyerId: 'buyer_id', status: 'status',
  },
  invoices: {
    id: 'id', invoiceNumber: 'invoice_number', type: 'type', status: 'status',
    userId: 'user_id', serviceAppointmentId: 'service_appointment_id',
    workshopRegistrationId: 'workshop_registration_id',
    subtotalCents: 'subtotal_cents', taxCents: 'tax_cents',
    totalCents: 'total_cents', currency: 'currency', taxRate: 'tax_rate',
    lineItems: 'line_items', issueDate: 'issue_date',
    notes: 'notes', paymentTerms: 'payment_terms',
  },
}))

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
    }),
  },
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Payrexx client
jest.mock('@/lib/payments/payrexx-client', () => ({
  createGateway: jest.fn().mockResolvedValue({
    id: 123456,
    link: 'https://mock.payrexx.com/pay/123456',
  }),
}))

import {
  calculateFees,
  calculateSwissVAT,
  buildInvoiceLineItem,
  centsToDisplay,
  getPaymentProvider,
  processPayment,
  processPaymentWithoutInvoice,
  DEFAULT_CURRENCY,
  DEFAULT_AUTO_RELEASE_DAYS,
} from '../payment-flow'
import type { PaymentProvider, ProcessPaymentParams } from '../payment-flow'
import { SWISS_VAT_RATES } from '../tax-compliance'
import { createGateway } from '@/lib/payments/payrexx-client'
import { db } from '@/db'

const mockCreateGateway = createGateway as jest.MockedFunction<typeof createGateway>

// Get reference to mocked db (defined in jest.mock factory above)
const mockDb = db as unknown as {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  execute: jest.Mock
  transaction: jest.Mock
}

// Queue-based result system for Drizzle chain mocks
let mockDbResolveQueue: unknown[] = []

function queueDbResult(...results: unknown[]) {
  mockDbResolveQueue.push(...results)
}

function setupSelectChain() {
  mockDb.select.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      from: jest.fn(),
      where: jest.fn(),
      innerJoin: jest.fn(),
      leftJoin: jest.fn(),
    }
    ;(chain.from as jest.Mock).mockImplementation(() => {
      const fromChain: Record<string, unknown> = {
        where: jest.fn().mockImplementation(() => {
          const result = mockDbResolveQueue.shift() ?? []
          return Promise.resolve(result)
        }),
        then: (resolve: (v: unknown) => void) => {
          const result = mockDbResolveQueue.shift() ?? []
          return Promise.resolve(result).then(resolve)
        },
      }
      return fromChain
    })
    return chain
  })
}

function setupInsertChain() {
  mockDb.insert.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      values: jest.fn(),
    }
    ;(chain.values as jest.Mock).mockImplementation(() => {
      const valuesChain: Record<string, unknown> = {
        returning: jest.fn().mockImplementation(() => {
          const result = mockDbResolveQueue.shift() ?? []
          return Promise.resolve(result)
        }),
        then: (resolve: (v: unknown) => void) => {
          const result = mockDbResolveQueue.shift() ?? []
          return Promise.resolve(result).then(resolve)
        },
      }
      return valuesChain
    })
    return chain
  })
}

function setupUpdateChain() {
  mockDb.update.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      set: jest.fn(),
    }
    ;(chain.set as jest.Mock).mockImplementation(() => {
      const setChain: Record<string, unknown> = {
        where: jest.fn(),
      }
      ;(setChain.where as jest.Mock).mockImplementation(() => {
        mockDbResolveQueue.shift()
        return Promise.resolve()
      })
      return setChain
    })
    return chain
  })
}

function setupAllMocks() {
  setupSelectChain()
  setupInsertChain()
  setupUpdateChain()
}

// ============================================================================
// calculateFees
// ============================================================================

describe('calculateFees', () => {
  const provider: PaymentProvider = {
    id: 'provider-1',
    slug: 'payrexx',
    fee_percentage: 2.9,
    fee_fixed_cents: 30,
  }

  it('calculates fees correctly for a standard amount', () => {
    const result = calculateFees(10000, provider, 'CHF')
    expect(result.feeCents).toBe(320)
    expect(result.baseAmountCents).toBe(10000)
    expect(result.totalAmountCents).toBe(10320)
    expect(result.currency).toBe('CHF')
  })

  it('calculates fees for zero amount', () => {
    const result = calculateFees(0, provider)
    expect(result.feeCents).toBe(30)
    expect(result.baseAmountCents).toBe(0)
    expect(result.totalAmountCents).toBe(30)
  })

  it('calculates fees for small amount (1 cent)', () => {
    const result = calculateFees(1, provider)
    expect(result.feeCents).toBe(30)
    expect(result.totalAmountCents).toBe(31)
  })

  it('calculates fees for large amount (100 CHF = 10000 cents)', () => {
    const result = calculateFees(100_00, provider, 'EUR')
    expect(result.feeCents).toBe(320)
    expect(result.totalAmountCents).toBe(10320)
    expect(result.currency).toBe('EUR')
  })

  it('defaults currency to CHF', () => {
    const result = calculateFees(5000, provider)
    expect(result.currency).toBe('CHF')
  })

  it('handles provider with zero fees', () => {
    const freeProvider: PaymentProvider = {
      id: 'free-1',
      slug: 'free',
      fee_percentage: 0,
      fee_fixed_cents: 0,
    }
    const result = calculateFees(5000, freeProvider)
    expect(result.feeCents).toBe(0)
    expect(result.totalAmountCents).toBe(5000)
  })

  it('handles rounding correctly for fractional fees', () => {
    const result = calculateFees(3333, provider)
    expect(result.feeCents).toBe(97 + 30)
  })
})

// ============================================================================
// calculateSwissVAT
// ============================================================================

describe('calculateSwissVAT', () => {
  it('calculates 7.7% VAT on a standard amount', () => {
    expect(calculateSwissVAT(10000)).toBe(770)
  })

  it('returns 0 for zero amount', () => {
    expect(calculateSwissVAT(0)).toBe(0)
  })

  it('rounds correctly for fractional VAT', () => {
    expect(calculateSwissVAT(1234)).toBe(95)
  })

  it('handles large amounts', () => {
    expect(calculateSwissVAT(1_000_000)).toBe(77000)
  })

  it('uses the standard Swiss VAT rate', () => {
    const amount = 10000
    const expected = Math.round(amount * SWISS_VAT_RATES.standard)
    expect(calculateSwissVAT(amount)).toBe(expected)
  })
})

// ============================================================================
// buildInvoiceLineItem
// ============================================================================

describe('buildInvoiceLineItem', () => {
  it('builds line item with default quantity of 1', () => {
    const item = buildInvoiceLineItem('Reparatur-Service', 5000)
    expect(item.description).toBe('Reparatur-Service')
    expect(item.quantity).toBe(1)
    expect(item.unitPrice).toBe('50.00')
    expect(item.total).toBe('50.00')
  })

  it('builds line item with specified quantity', () => {
    const item = buildInvoiceLineItem('Workshop-Teilnahme', 2500, 3)
    expect(item.quantity).toBe(3)
    expect(item.unitPrice).toBe('25.00')
    expect(item.total).toBe('25.00')
  })

  it('formats cents to two decimal places', () => {
    const item = buildInvoiceLineItem('Test', 1)
    expect(item.unitPrice).toBe('0.01')
  })

  it('handles zero amount', () => {
    const item = buildInvoiceLineItem('Kostenlos', 0)
    expect(item.unitPrice).toBe('0.00')
  })
})

// ============================================================================
// centsToDisplay
// ============================================================================

describe('centsToDisplay', () => {
  it('converts cents to display amount', () => {
    expect(centsToDisplay(100)).toBe(1)
    expect(centsToDisplay(5099)).toBe(50.99)
    expect(centsToDisplay(0)).toBe(0)
    expect(centsToDisplay(1)).toBe(0.01)
  })
})

// ============================================================================
// Constants
// ============================================================================

describe('payment-flow constants', () => {
  it('has correct defaults', () => {
    expect(DEFAULT_CURRENCY).toBe('CHF')
    expect(DEFAULT_AUTO_RELEASE_DAYS).toBe(7)
  })
})

// ============================================================================
// getPaymentProvider (mocked Drizzle DB)
// ============================================================================

describe('getPaymentProvider', () => {
  beforeEach(() => {
    mockDbResolveQueue = []
    setupAllMocks()
  })

  it('returns provider when found', async () => {
    queueDbResult([{ id: 'p1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])

    const result = await getPaymentProvider('payrexx')
    expect(result).toEqual({
      id: 'p1', slug: 'payrexx', fee_percentage: 2.9, fee_fixed_cents: 30,
    })
  })

  it('returns null when no provider found', async () => {
    queueDbResult([])

    const result = await getPaymentProvider('unknown')
    expect(result).toBeNull()
  })

  it('defaults to payrexx provider slug', async () => {
    queueDbResult([{ id: 'p1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])

    const result = await getPaymentProvider()
    expect(result).not.toBeNull()
    expect(mockDb.select).toHaveBeenCalled()
  })
})

// ============================================================================
// processPayment (integration-level with mocks)
// ============================================================================

describe('processPayment', () => {
  beforeEach(() => {
    mockDbResolveQueue = []
    setupAllMocks()
    mockCreateGateway.mockClear()
    mockCreateGateway.mockResolvedValue({
      id: 123456,
      link: 'https://mock.payrexx.com/pay/123456',
    })
  })

  const baseParams: ProcessPaymentParams = {
    userId: 'user-1',
    baseAmountCents: 5000,
    currency: 'CHF',
    useEscrow: false,
    paymentDescription: 'Test',
    paymentMetadata: { type: 'test' },
    successRedirectUrl: 'http://localhost:3000/success',
    failedRedirectUrl: 'http://localhost:3000/failed',
    cancelRedirectUrl: 'http://localhost:3000/cancel',
    invoiceLineItems: [{ description: 'Item', quantity: 1, unitPrice: '50.00', total: '50.00' }],
    invoiceNotes: 'Test',
    invoicePaymentTerms: '30 Tage',
  }

  it('throws when payment provider not found', async () => {
    queueDbResult([]) // getPaymentProvider returns empty

    await expect(processPayment(baseParams)).rejects.toThrow('Payment provider not available')
  })

  it('completes full flow without escrow', async () => {
    // getPaymentProvider
    queueDbResult([{ id: 'p1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])
    // createTransaction
    queueDbResult([{ id: 'txn-1' }])
    // updateTransaction (providerTransactionId) — consumed by update chain
    queueDbResult(undefined)
    // createInvoice
    queueDbResult([{ id: 'inv-1', invoiceNumber: 'INV-001' }])

    const result = await processPayment(baseParams)

    expect(result.gatewayId).toBe(123456)
    expect(result.paymentUrl).toBe('https://mock.payrexx.com/pay/123456')
    expect(result.transactionId).toBe('txn-1')
    expect(result.invoiceId).toBe('inv-1')
    expect(result.invoiceNumber).toBe('INV-001')
    expect(result.currency).toBe('CHF')
    expect(mockCreateGateway).toHaveBeenCalledTimes(1)
  })

  it('calls createGateway with correct params', async () => {
    queueDbResult([{ id: 'p1', slug: 'payrexx', fee_percentage: '0', fee_fixed_cents: 0 }])
    queueDbResult([{ id: 'txn-2' }])
    queueDbResult(undefined)
    queueDbResult([{ id: 'inv-2', invoiceNumber: 'INV-002' }])

    await processPayment(baseParams)

    expect(mockCreateGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5000, // no fees since 0%
        currency: 'CHF',
        referenceId: 'txn-2',
        successRedirectUrl: 'http://localhost:3000/success',
        failedRedirectUrl: 'http://localhost:3000/failed',
        cancelRedirectUrl: 'http://localhost:3000/cancel',
      })
    )
  })
})

// ============================================================================
// processPaymentWithoutInvoice
// ============================================================================

describe('processPaymentWithoutInvoice', () => {
  beforeEach(() => {
    mockDbResolveQueue = []
    setupAllMocks()
    mockCreateGateway.mockClear()
    mockCreateGateway.mockResolvedValue({
      id: 789012,
      link: 'https://mock.payrexx.com/pay/789012',
    })
  })

  it('completes flow without creating invoice', async () => {
    // getPaymentProvider
    queueDbResult([{ id: 'p1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])
    // createTransaction
    queueDbResult([{ id: 'txn-noinv' }])
    // updateTransaction (providerTransactionId)
    queueDbResult(undefined)

    const result = await processPaymentWithoutInvoice({
      userId: 'user-1',
      baseAmountCents: 5000,
      useEscrow: false,
      paymentDescription: 'Existing appointment',
      paymentMetadata: { appointmentId: 'apt-1' },
      successRedirectUrl: 'http://localhost:3000/success',
      failedRedirectUrl: 'http://localhost:3000/failed',
      cancelRedirectUrl: 'http://localhost:3000/cancel',
    })

    expect(result.gatewayId).toBe(789012)
    expect(result.paymentUrl).toBe('https://mock.payrexx.com/pay/789012')
    expect(result.transactionId).toBe('txn-noinv')
    expect((result as Record<string, unknown>).invoiceId).toBeUndefined()
    expect(mockCreateGateway).toHaveBeenCalledTimes(1)
  })
})
