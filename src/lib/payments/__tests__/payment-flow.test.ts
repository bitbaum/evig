/**
 * Tests for payment-flow.ts pure utility functions
 *
 * Tests calculateFees, calculateSwissVAT, buildInvoiceLineItem, centsToDisplay,
 * and the high-level processPayment orchestrator (with mocks).
 */

// Mock next/server (jsdom environment doesn't have Request)
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
    }),
  },
}))

// Mock db query for transaction/escrow/invoice functions
jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
}))

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import {
  calculateFees,
  calculateSwissVAT,
  buildInvoiceLineItem,
  centsToDisplay,
  createPaymentIntent,
  createTransaction,
  createEscrowAccount,
  createInvoice,
  getPaymentProvider,
  processPayment,
  processPaymentWithoutInvoice,
  DEFAULT_CURRENCY,
  DEFAULT_AUTO_RELEASE_DAYS,
} from '../payment-flow'
import type { PaymentProvider, TransactionParams, EscrowParams, InvoiceParams, ProcessPaymentParams } from '../payment-flow'
import { SWISS_VAT_RATES } from '../tax-compliance'
import { query } from '@/lib/auth/db'

const mockQuery = query as jest.MockedFunction<typeof query>

// ============================================================================
// calculateFees
// ============================================================================

describe('calculateFees', () => {
  const provider: PaymentProvider = {
    id: 'provider-1',
    slug: 'stripe',
    fee_percentage: 2.9,
    fee_fixed_cents: 30,
  }

  it('calculates fees correctly for a standard amount', () => {
    const result = calculateFees(10000, provider, 'CHF')

    // fee = round(10000 * 2.9/100) + 30 = round(290) + 30 = 320
    expect(result.feeCents).toBe(320)
    expect(result.baseAmountCents).toBe(10000)
    expect(result.totalAmountCents).toBe(10320)
    expect(result.currency).toBe('CHF')
  })

  it('calculates fees for zero amount', () => {
    const result = calculateFees(0, provider)

    // fee = round(0) + 30 = 30
    expect(result.feeCents).toBe(30)
    expect(result.baseAmountCents).toBe(0)
    expect(result.totalAmountCents).toBe(30)
  })

  it('calculates fees for small amount (1 cent)', () => {
    const result = calculateFees(1, provider)

    // fee = round(1 * 2.9/100) + 30 = round(0.029) + 30 = 0 + 30 = 30
    expect(result.feeCents).toBe(30)
    expect(result.totalAmountCents).toBe(31)
  })

  it('calculates fees for large amount (100 CHF = 10000 cents)', () => {
    const result = calculateFees(100_00, provider, 'EUR')

    expect(result.feeCents).toBe(320) // round(10000 * 0.029) + 30
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
    // 3333 * 2.9/100 = 96.657 → rounds to 97
    const result = calculateFees(3333, provider)
    expect(result.feeCents).toBe(97 + 30)
  })
})

// ============================================================================
// calculateSwissVAT
// ============================================================================

describe('calculateSwissVAT', () => {
  it('calculates 7.7% VAT on a standard amount', () => {
    // 10000 * 0.077 = 770
    expect(calculateSwissVAT(10000)).toBe(770)
  })

  it('returns 0 for zero amount', () => {
    expect(calculateSwissVAT(0)).toBe(0)
  })

  it('rounds correctly for fractional VAT', () => {
    // 1234 * 0.077 = 95.018 → rounds to 95
    expect(calculateSwissVAT(1234)).toBe(95)
  })

  it('handles large amounts', () => {
    // 1_000_000 * 0.077 = 77000
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
    // Note: total is same as unitPrice (current implementation)
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
// getPaymentProvider (mocked DB)
// ============================================================================

describe('getPaymentProvider', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('returns provider when found', async () => {
    const provider = { id: 'p1', slug: 'stripe', fee_percentage: 2.9, fee_fixed_cents: 30 }
    mockQuery.mockResolvedValueOnce({ rows: [provider], rowCount: 1 } as never)

    const result = await getPaymentProvider('stripe')
    expect(result).toEqual(provider)
  })

  it('returns null when no provider found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never)

    const result = await getPaymentProvider('unknown')
    expect(result).toBeNull()
  })

  it('defaults to stripe provider slug', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'p1' }], rowCount: 1 } as never)

    await getPaymentProvider()
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('WHERE slug = $1'),
      ['stripe']
    )
  })
})

// ============================================================================
// createPaymentIntent (mocked Stripe)
// ============================================================================

describe('createPaymentIntent', () => {
  const createMockStripe = () => ({
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_test123',
        client_secret: 'cs_test123',
      }),
    },
  })

  it('creates a Stripe payment intent with correct params', async () => {
    const mockStripe = createMockStripe()

    const result = await createPaymentIntent(mockStripe as never, {
      amountCents: 5000,
      currency: 'CHF',
      metadata: { orderId: 'ord-1' },
      description: 'Test payment',
      useEscrow: false,
    })

    expect(result.paymentIntentId).toBe('pi_test123')
    expect(result.clientSecret).toBe('cs_test123')
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 5000,
      currency: 'chf',
      metadata: { orderId: 'ord-1' },
      automatic_payment_methods: { enabled: true },
      capture_method: 'automatic',
      description: 'Test payment',
    })
  })

  it('uses manual capture for escrow payments', async () => {
    const mockStripe = createMockStripe()
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_escrow',
      client_secret: 'cs_escrow',
    })

    await createPaymentIntent(mockStripe as never, {
      amountCents: 10000,
      currency: 'CHF',
      metadata: {},
      description: 'Escrow payment',
      useEscrow: true,
    })

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ capture_method: 'manual' })
    )
  })

  it('returns empty string if no client_secret', async () => {
    const mockStripe = createMockStripe()
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_nosecret',
      client_secret: null,
    })

    const result = await createPaymentIntent(mockStripe as never, {
      amountCents: 1000,
      currency: 'CHF',
      metadata: {},
      description: 'Test',
      useEscrow: false,
    })

    expect(result.clientSecret).toBe('')
  })
})

// ============================================================================
// createTransaction (mocked DB)
// ============================================================================

describe('createTransaction', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('inserts a transaction and returns the id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'txn-123' }], rowCount: 1 } as never)

    const params: TransactionParams = {
      userId: 'user-1',
      providerId: 'provider-1',
      providerTransactionId: 'pi_test',
      amountCents: 5000,
      feeCents: 175,
      netAmountCents: 4825,
      currency: 'CHF',
      description: 'Test transaction',
      useEscrow: false,
      autoReleaseDays: 7,
    }

    const result = await createTransaction(params)
    expect(result.transactionId).toBe('txn-123')
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// createEscrowAccount (mocked DB)
// ============================================================================

describe('createEscrowAccount', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('inserts an escrow account', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    const params: EscrowParams = {
      transactionId: 'txn-123',
      totalAmountCents: 5000,
      currency: 'CHF',
      autoReleaseDays: 7,
      buyerId: 'user-1',
    }

    await createEscrowAccount(params)
    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('escrow'),
      [params.transactionId, params.totalAmountCents, params.currency, params.autoReleaseDays, params.buyerId]
    )
  })
})

// ============================================================================
// createInvoice (mocked DB)
// ============================================================================

describe('createInvoice', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('creates an invoice and returns id + number', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'inv-1', invoice_number: 'INV-2024-001' }],
      rowCount: 1,
    } as never)

    const params: InvoiceParams = {
      userId: 'user-1',
      baseAmountCents: 5000,
      totalAmountCents: 5385,
      currency: 'CHF',
      lineItems: [{ description: 'Service', quantity: 1, unitPrice: '50.00', total: '50.00' }],
      notes: 'Danke',
      paymentTerms: '30 Tage',
    }

    const result = await createInvoice(params)
    expect(result.invoiceId).toBe('inv-1')
    expect(result.invoiceNumber).toBe('INV-2024-001')
  })
})

// ============================================================================
// processPayment (integration-level with mocks)
// ============================================================================

describe('processPayment', () => {
  const mockStripeObj = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_full_flow',
        client_secret: 'cs_full_flow',
      }),
    },
  }

  beforeEach(() => {
    mockQuery.mockReset()
    mockStripeObj.paymentIntents.create.mockClear()
  })

  const baseParams: ProcessPaymentParams = {
    stripe: mockStripeObj as never,
    userId: 'user-1',
    baseAmountCents: 5000,
    currency: 'CHF',
    useEscrow: false,
    paymentDescription: 'Test',
    paymentMetadata: { type: 'test' },
    invoiceLineItems: [{ description: 'Item', quantity: 1, unitPrice: '50.00', total: '50.00' }],
    invoiceNotes: 'Test',
    invoicePaymentTerms: '30 Tage',
  }

  it('throws when payment provider not found', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never) // getPaymentProvider

    await expect(processPayment(baseParams)).rejects.toThrow('Payment provider not available')
  })

  it('completes full flow without escrow', async () => {
    // getPaymentProvider
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'p1', slug: 'stripe', fee_percentage: 2.9, fee_fixed_cents: 30 }],
      rowCount: 1,
    } as never)
    // createTransaction
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'txn-1' }], rowCount: 1 } as never)
    // createInvoice
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'inv-1', invoice_number: 'INV-001' }],
      rowCount: 1,
    } as never)

    const result = await processPayment(baseParams)

    expect(result.paymentIntentId).toBe('pi_full_flow')
    expect(result.clientSecret).toBe('cs_full_flow')
    expect(result.transactionId).toBe('txn-1')
    expect(result.invoiceId).toBe('inv-1')
    expect(result.invoiceNumber).toBe('INV-001')
    expect(result.currency).toBe('CHF')
    // 3 DB calls: provider + transaction + invoice (no escrow)
    expect(mockQuery).toHaveBeenCalledTimes(3)
  })

  it('completes full flow with escrow', async () => {
    // getPaymentProvider
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'p1', slug: 'stripe', fee_percentage: 2.9, fee_fixed_cents: 30 }],
      rowCount: 1,
    } as never)
    // createTransaction
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'txn-2' }], rowCount: 1 } as never)
    // createEscrowAccount
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)
    // createInvoice
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'inv-2', invoice_number: 'INV-002' }],
      rowCount: 1,
    } as never)

    const result = await processPayment({ ...baseParams, useEscrow: true })

    expect(result.transactionId).toBe('txn-2')
    // 4 DB calls: provider + transaction + escrow + invoice
    expect(mockQuery).toHaveBeenCalledTimes(4)
  })
})

// ============================================================================
// processPaymentWithoutInvoice
// ============================================================================

describe('processPaymentWithoutInvoice', () => {
  const mockStripeObj2 = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({
        id: 'pi_no_inv',
        client_secret: 'cs_no_inv',
      }),
    },
  }

  beforeEach(() => {
    mockQuery.mockReset()
    mockStripeObj2.paymentIntents.create.mockClear()
  })

  it('completes flow without creating invoice', async () => {
    // getPaymentProvider
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'p1', slug: 'stripe', fee_percentage: 2.9, fee_fixed_cents: 30 }],
      rowCount: 1,
    } as never)
    // createTransaction
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'txn-noinv' }], rowCount: 1 } as never)

    const result = await processPaymentWithoutInvoice({
      stripe: mockStripeObj2 as never,
      userId: 'user-1',
      baseAmountCents: 5000,
      useEscrow: false,
      paymentDescription: 'Existing appointment',
      paymentMetadata: { appointmentId: 'apt-1' },
    })

    expect(result.paymentIntentId).toBe('pi_no_inv')
    expect(result.transactionId).toBe('txn-noinv')
    // No invoiceId/invoiceNumber on result type
    expect((result as Record<string, unknown>).invoiceId).toBeUndefined()
    // 2 DB calls: provider + transaction (no escrow, no invoice)
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })
})
