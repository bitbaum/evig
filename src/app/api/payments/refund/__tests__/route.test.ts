/**
 * @jest-environment node
 *
 * Tests for POST /api/payments/refund
 *
 * Behaviors locked:
 *   POST - 401 (unauthenticated), 400 (invalid body), 404 (transaction not found),
 *          401 (not owner or admin), 400 (amount exceeds transaction),
 *          200 (user refund request — status: requested),
 *          200 (admin refund — immediate Payrexx processing, status: processing)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockValues = jest.fn()
const mockSet = jest.fn()
const mockDbTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  paymentTransactions: { id: 'pt_id', userId: 'pt_userId', providerId: 'pt_providerId', providerTransactionId: 'pt_providerTransactionId', amountCents: 'pt_amountCents', currency: 'pt_currency', status: 'pt_status', type: 'pt_type', description: 'pt_description' },
  paymentProviders: { id: 'pp_id', slug: 'pp_slug' },
  refunds: { id: 'r_id', refundNumber: 'r_refundNumber', originalTransactionId: 'r_originalTransactionId', amountCents: 'r_amountCents', currency: 'r_currency', reason: 'r_reason', reasonDetails: 'r_reasonDetails', requestedBy: 'r_requestedBy', customerNotes: 'r_customerNotes', status: 'r_status', refundTransactionId: 'r_refundTransactionId', processedBy: 'r_processedBy', processedAt: 'r_processedAt', approvedAt: 'r_approvedAt', approvedBy: 'r_approvedBy', internalNotes: 'r_internalNotes' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  inArray: (a: unknown, b: unknown) => ({ __inArray: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { SUCCEEDED: 'succeeded', PENDING: 'pending' },
  PAYMENT_TRANSACTION_TYPE: { REFUND: 'refund' },
}))

jest.mock('@/config/refund', () => ({
  REFUND_STATUS: {
    REQUESTED: 'requested',
    APPROVED: 'approved',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    REJECTED: 'rejected',
  },
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  refundTransaction: jest.fn().mockResolvedValue({ id: 'payrexx-refund-1' }),
}))

jest.mock('@/lib/schemas', () => {
  const actual = jest.requireActual('@/lib/schemas')
  return actual
})

import { NextRequest } from 'next/server'
import { POST } from '../route'
import { refundTransaction } from '@/lib/payments/payrexx-client'

const mockRefundTransaction = refundTransaction as jest.MockedFunction<typeof refundTransaction>

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] },
  expires: '2027-01-01',
}

// Must be a valid UUID (uuidSchema = z.string().uuid())
const VALID_TX_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const MOCK_TRANSACTION = {
  id: VALID_TX_ID,
  userId: 'user-1',
  providerId: 'provider-1',
  providerTransactionId: 'prov-tx-1',
  amountCents: 10000,
  currency: 'CHF',
  providerSlug: 'payrexx',
  userName: 'User',
  userEmail: 'user@example.com',
}

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/payments/refund', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function setupSelectChain(txRow: unknown, existingRefundsTotal = 0) {
  const mockWhere = jest.fn()
  const mockFrom = jest.fn()
  const mockInnerJoinFirst = jest.fn()
  const mockInnerJoinSecond = jest.fn()

  // First select: transaction with joins
  mockInnerJoinSecond.mockReturnValue({ where: mockWhere })
  mockInnerJoinFirst.mockReturnValue({ innerJoin: mockInnerJoinSecond })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoinFirst })

  // Second select: existing refunds SUM
  const mockWhere2 = jest.fn()
  const mockFrom2 = jest.fn()
  mockFrom2.mockReturnValue({ where: mockWhere2 })

  let callCount = 0
  mockSelect.mockImplementation(() => {
    callCount++
    if (callCount === 1) {
      mockWhere.mockResolvedValue(txRow ? [txRow] : [])
      return { from: mockFrom }
    } else {
      mockWhere2.mockResolvedValue([{ totalRefunded: existingRefundsTotal }])
      return { from: mockFrom2 }
    }
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  setupSelectChain(MOCK_TRANSACTION)

  // Default insert returning a refund row
  mockValues.mockReturnValue({
    returning: jest.fn().mockResolvedValue([{ id: 'refund-1', refundNumber: 'REF-001' }]),
  })

  // Default update chain
  const mockWhere3 = jest.fn().mockResolvedValue(undefined)
  mockSet.mockReturnValue({ where: mockWhere3 })

  // Default db.transaction (for admin path)
  mockDbTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const mockTx = {
      update: () => ({ set: () => ({ where: jest.fn().mockResolvedValue(undefined) }) }),
      insert: () => ({ values: jest.fn().mockResolvedValue(undefined) }),
    }
    return fn(mockTx)
  })

  // Re-setup payrexx-client mock after resetAllMocks clears implementations
  mockRefundTransaction.mockResolvedValue({ id: 'payrexx-refund-1' })
})

// ============================================================================
// Unauthenticated
// ============================================================================

describe('POST /api/payments/refund — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 100, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// Validation
// ============================================================================

describe('POST /api/payments/refund — validation', () => {
  it('returns 400 when transactionId is missing', async () => {
    const req = makeRequest({ amount: 100, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when amount is not positive', async () => {
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 0, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when reason is missing', async () => {
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 50 })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// Not found
// ============================================================================

describe('POST /api/payments/refund — not found', () => {
  it('returns 404 when transaction does not exist or is not succeeded', async () => {
    setupSelectChain(null)
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 50, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// Permission
// ============================================================================

describe('POST /api/payments/refund — permission', () => {
  it('returns 401 when user does not own the transaction', async () => {
    setupSelectChain({ ...MOCK_TRANSACTION, userId: 'other-user' })
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 50, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// Amount validation
// ============================================================================

describe('POST /api/payments/refund — amount exceeded', () => {
  it('returns 400 when refund amount exceeds transaction amount', async () => {
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 200, reason: 'Defekt' }) // 200 CHF > 100 CHF
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when refund amount exceeds remaining (after prior refunds)', async () => {
    setupSelectChain(MOCK_TRANSACTION, 8000) // 80 CHF already refunded of 100 CHF
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 30, reason: 'Defekt' }) // 30 > 20 remaining
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// Success — regular user
// ============================================================================

describe('POST /api/payments/refund — user refund request', () => {
  it('returns 200 with status requested (not immediately processed)', async () => {
    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 50, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('requested')
    expect(body.data.refundId).toBe('refund-1')
    expect(mockRefundTransaction).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Success — admin
// ============================================================================

describe('POST /api/payments/refund — admin immediate processing', () => {
  it('returns 200 with status processing and calls Payrexx', async () => {
    mockAuth.mockResolvedValueOnce(ADMIN_SESSION)
    setupSelectChain({ ...MOCK_TRANSACTION, userId: 'user-1' })

    const req = makeRequest({ transactionId: VALID_TX_ID, amount: 50, reason: 'Defekt' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('processing')
    expect(mockRefundTransaction).toHaveBeenCalledWith('prov-tx-1', 5000)
  })
})
