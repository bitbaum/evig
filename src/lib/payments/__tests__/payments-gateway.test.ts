/**
 * Tests for payments/payments-gateway.ts — payment provider and transaction DB ops.
 *
 * Mission-relevant: payments are financial transactions. If getPaymentProvider
 * returns null due to a DB schema mismatch, the entire checkout flow breaks
 * silently. If createTransaction doesn't persist escrow release dates
 * correctly, funds get released too early.
 *
 * Behaviors locked:
 *   getPaymentProvider
 *   - returns null when no active provider found
 *   - returns mapped provider when found
 *   - uses 'payrexx' as default slug
 *   - coerces fee_percentage to Number
 *
 *   createTransaction
 *   - inserts record and returns transactionId
 *   - sets escrowReleaseDate SQL expression when useEscrow=true
 *   - sets escrowReleaseDate to null when useEscrow=false
 *
 *   updateTransactionGatewayId
 *   - calls db.update once
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.update = jest.fn().mockReturnValue(chain)
  chain.set = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbInsert = jest.fn(() => makeChain([]))
const mockDbUpdate = jest.fn(() => makeChain())

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    insert: (...args: unknown[]) => mockDbInsert.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  paymentProviders: {
    id: 'pp_id', slug: 'pp_slug', feePercentage: 'pp_feePercentage',
    feeFixedCents: 'pp_feeFixedCents', isActive: 'pp_isActive',
  },
  paymentTransactions: {
    id: 'pt_id', userId: 'pt_userId', providerId: 'pt_providerId',
    providerTransactionId: 'pt_providerTransactionId', type: 'pt_type',
    status: 'pt_status', amountCents: 'pt_amountCents', currency: 'pt_currency',
    feeCents: 'pt_feeCents', netAmountCents: 'pt_netAmountCents',
    serviceAppointmentId: 'pt_serviceAppointmentId',
    workshopRegistrationId: 'pt_workshopRegistrationId',
    description: 'pt_description', escrowReleaseDate: 'pt_escrowReleaseDate',
    metadata: 'pt_metadata',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { PENDING: 'pending', COMPLETED: 'completed' },
  PAYMENT_TRANSACTION_TYPE: { PAYMENT: 'payment' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getPaymentProvider, createTransaction, updateTransactionGatewayId } from '../payments-gateway'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_TX_PARAMS = {
  userId: 'user-1',
  providerId: 'provider-1',
  amountCents: 8900,
  feeCents: 250,
  netAmountCents: 8650,
  currency: 'CHF' as const,
  description: 'Computer Repair Booking',
  useEscrow: false,
  autoReleaseDays: 7,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbInsert.mockImplementation(() => makeChain([{ id: 'tx-new-1' }]))
  mockDbUpdate.mockImplementation(() => makeChain())
})

// ============================================================================
// getPaymentProvider
// ============================================================================

describe('getPaymentProvider', () => {
  it('returns null when no active provider found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    const result = await getPaymentProvider('unknown-provider')

    expect(result).toBeNull()
  })

  it('returns mapped provider data when found', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([{ id: 'prov-1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])
    )

    const result = await getPaymentProvider('payrexx')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('prov-1')
    expect(result!.slug).toBe('payrexx')
    expect(result!.fee_percentage).toBe(2.9)    // coerced to Number
    expect(result!.fee_fixed_cents).toBe(30)
  })

  it('uses payrexx as default slug when none given', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([{ id: 'prov-1', slug: 'payrexx', fee_percentage: '2.9', fee_fixed_cents: 30 }])
    )

    await getPaymentProvider()

    const { eq } = jest.requireMock('drizzle-orm') as { eq: jest.Mock }
    // eq should be called with the slug column and 'payrexx'
    const slugCall = eq.mock.calls.find(([, v]: [unknown, string]) => v === 'payrexx')
    expect(slugCall).toBeDefined()
  })

  it('coerces null fee_percentage to 0', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([{ id: 'p', slug: 's', fee_percentage: null, fee_fixed_cents: 0 }])
    )

    const result = await getPaymentProvider('s')

    expect(result!.fee_percentage).toBe(0)
  })
})

// ============================================================================
// createTransaction
// ============================================================================

describe('createTransaction', () => {
  it('inserts a transaction and returns its ID', async () => {
    const result = await createTransaction(BASE_TX_PARAMS)

    expect(result.transactionId).toBe('tx-new-1')
    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('sets escrowReleaseDate to null when useEscrow=false', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'tx-1' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createTransaction({ ...BASE_TX_PARAMS, useEscrow: false })

    expect((capturedValues as unknown as Record<string, unknown>)?.escrowReleaseDate).toBeNull()
  })

  it('sets escrowReleaseDate SQL expression when useEscrow=true', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'tx-1' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createTransaction({ ...BASE_TX_PARAMS, useEscrow: true, autoReleaseDays: 14 })

    // escrowReleaseDate should be a sql expression (not null)
    expect((capturedValues as unknown as Record<string, unknown>)?.escrowReleaseDate).not.toBeNull()
  })
})

// ============================================================================
// updateTransactionGatewayId
// ============================================================================

describe('updateTransactionGatewayId', () => {
  it('calls db.update once', async () => {
    await updateTransactionGatewayId('tx-1', 999)

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })
})
