/**
 * Tests for payments/payments-escrow.ts — escrow account creation.
 *
 * Mission-relevant: escrow accounts hold payment funds between buyer and seller
 * in service transactions. If createEscrowAccount inserts with the wrong status
 * (e.g., 'released' instead of 'active'), funds are immediately released.
 *
 * Behaviors locked:
 *   createEscrowAccount
 *   - calls db.insert once
 *   - inserts with ESCROW_STATUS.ACTIVE
 *   - passes transactionId, amount, currency, autoReleaseDays from params
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = undefined) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbInsert = jest.fn(() => makeChain())

jest.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockDbInsert(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  escrowAccounts: {
    transactionId: 'ea_transactionId', totalAmountCents: 'ea_totalAmountCents',
    currency: 'ea_currency', autoReleaseDays: 'ea_autoReleaseDays',
    releaseDeadline: 'ea_releaseDeadline', buyerId: 'ea_buyerId',
    status: 'ea_status',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

jest.mock('@/config/payment-status', () => ({
  ESCROW_STATUS: { ACTIVE: 'active', RELEASED: 'released' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { createEscrowAccount } from '../payments-escrow'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  transactionId: 'tx-1',
  totalAmountCents: 15000,
  currency: 'CHF' as const,
  autoReleaseDays: 7,
  buyerId: 'user-1',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbInsert.mockImplementation(() => makeChain())
})

// ============================================================================
// createEscrowAccount
// ============================================================================

describe('createEscrowAccount', () => {
  it('calls db.insert once', async () => {
    await createEscrowAccount(BASE_PARAMS)

    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('inserts with ESCROW_STATUS.ACTIVE', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain()
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createEscrowAccount(BASE_PARAMS)

    expect(capturedValues?.status).toBe('active')
  })

  it('passes all params from EscrowParams', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain()
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createEscrowAccount(BASE_PARAMS)

    expect(capturedValues?.transactionId).toBe('tx-1')
    expect(capturedValues?.totalAmountCents).toBe(15000)
    expect(capturedValues?.currency).toBe('CHF')
    expect(capturedValues?.autoReleaseDays).toBe(7)
    expect(capturedValues?.buyerId).toBe('user-1')
  })
})
