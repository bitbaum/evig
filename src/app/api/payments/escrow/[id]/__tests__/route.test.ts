/**
 * @jest-environment node
 *
 * Tests for GET /api/payments/escrow/[id] and POST /api/payments/escrow/[id]
 *
 * Behaviors locked:
 *   GET  - 401 (unauthenticated), 404 (not found), 401 (no permission), 200 (owner/admin)
 *   POST - 401 (unauthenticated), 400 (invalid body), 404 (not found/not active),
 *          401 (not buyer or admin), 400 (amount too large), 200 (full release), 200 (partial release)
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

const mockExecute = jest.fn()
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockValues = jest.fn()
const mockSet = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  escrowAccounts: { id: 'ea_id', transactionId: 'ea_txId', buyerId: 'ea_buyerId', sellerId: 'ea_sellerId', totalAmountCents: 'ea_totalAmountCents', releasedAmountCents: 'ea_releasedAmountCents', currency: 'ea_currency', status: 'ea_status', auto_release_days: 'ea_autoReleaseDays', releaseNotes: 'ea_releaseNotes', releasedAt: 'ea_releasedAt', updatedAt: 'ea_updatedAt' },
  escrowReleases: { id: 'er_id', escrowAccountId: 'er_escrowAccountId', transactionId: 'er_transactionId', amountCents: 'er_amountCents', releaseType: 'er_releaseType', reason: 'er_reason', releasedBy: 'er_releasedBy' },
  paymentTransactions: { id: 'pt_id', userId: 'pt_userId', providerId: 'pt_providerId', providerTransactionId: 'pt_providerTransactionId', amountCents: 'pt_amountCents', currency: 'pt_currency', type: 'pt_type', status: 'pt_status', description: 'pt_description' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
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
  ESCROW_STATUS: { ACTIVE: 'active', RELEASED: 'released' },
  PAYMENT_TRANSACTION_TYPE: { TRANSFER: 'transfer' },
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  captureTransaction: jest.fn().mockResolvedValue({ id: 'capture-1' }),
  cancelTransaction: jest.fn().mockResolvedValue({ id: 'cancel-1' }),
}))

jest.mock('@/lib/schemas', () => {
  const actual = jest.requireActual('@/lib/schemas')
  return actual
})

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-buyer', email: 'buyer@example.com', name: 'Buyer', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const ADMIN_SESSION = {
  user: { id: 'user-admin', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] },
  expires: '2027-01-01',
}

const MOCK_ESCROW_ROW = {
  id: 'escrow-1',
  transaction_id: 'tx-1',
  buyer_id: 'user-buyer',
  seller_id: 'user-seller',
  total_amount_cents: 10000,
  held_amount_cents: 10000,
  released_amount_cents: 0,
  currency: 'CHF',
  status: 'active',
  auto_release_days: 7,
  release_deadline: '2027-01-01',
  created_at: '2026-01-01',
  released_at: null,
  provider_transaction_id: 'prov-tx-1',
  transaction_amount: 10000,
  buyer_name: 'Buyer',
  buyer_email: 'buyer@example.com',
  seller_name: 'Seller',
  seller_email: 'seller@example.com',
  releases: null,
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/payments/escrow/${id}`)
}

function makePostRequest(id: string, body: unknown) {
  return new NextRequest(`http://localhost/api/payments/escrow/${id}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default: db.execute returns escrow row
  mockExecute.mockResolvedValue({ rows: [MOCK_ESCROW_ROW] })

  // Default: db.select chain for POST
  const mockWhere = jest.fn()
  const mockFrom = jest.fn()
  const mockInnerJoin = jest.fn()
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockSelect.mockReturnValue({ from: mockFrom })
  mockWhere.mockResolvedValue([{
    id: 'escrow-1',
    transactionId: 'tx-1',
    buyerId: 'user-buyer',
    sellerId: 'user-seller',
    totalAmountCents: 10000,
    releasedAmountCents: 0,
    currency: 'CHF',
    status: 'active',
    providerId: 'provider-1',
    providerTransactionId: 'prov-tx-1',
    transactionAmount: 10000,
  }])

  // db.insert chain
  mockValues.mockResolvedValue(undefined)

  // db.update chain
  const mockWhere2 = jest.fn().mockResolvedValue(undefined)
  mockSet.mockReturnValue({ where: mockWhere2 })
})

// ============================================================================
// GET — unauthenticated
// ============================================================================

describe('GET /api/payments/escrow/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeGetRequest('escrow-1')
    const response = await GET(req, makeContext('escrow-1'))
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET — not found
// ============================================================================

describe('GET /api/payments/escrow/[id] — not found', () => {
  it('returns 404 when escrow does not exist', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const req = makeGetRequest('escrow-unknown')
    const response = await GET(req, makeContext('escrow-unknown'))
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// GET — permission check
// ============================================================================

describe('GET /api/payments/escrow/[id] — permission check', () => {
  it('returns 401 when user is not buyer, seller, or admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'other-user', email: 'other@example.com', isStaff: false, staffPermissions: [] },
      expires: '2027-01-01',
    })
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_ESCROW_ROW] })
    const req = makeGetRequest('escrow-1')
    const response = await GET(req, makeContext('escrow-1'))
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET — success
// ============================================================================

describe('GET /api/payments/escrow/[id] — success', () => {
  it('returns 200 with escrow data for the buyer', async () => {
    const req = makeGetRequest('escrow-1')
    const response = await GET(req, makeContext('escrow-1'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.escrow.id).toBe('escrow-1')
    expect(body.data.escrow.totalAmount).toBe(100) // 10000 cents / 100
    expect(body.data.escrow.currency).toBe('CHF')
  })

  it('returns 200 for admin user regardless of ownership', async () => {
    mockAuth.mockResolvedValueOnce(ADMIN_SESSION)
    mockExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_ESCROW_ROW, buyer_id: 'someone-else' }] })
    const req = makeGetRequest('escrow-1')
    const response = await GET(req, makeContext('escrow-1'))
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// POST — unauthenticated
// ============================================================================

describe('POST /api/payments/escrow/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makePostRequest('escrow-1', { amount: 100, releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/payments/escrow/[id] — validation', () => {
  it('returns 400 when amount is missing', async () => {
    const req = makePostRequest('escrow-1', { releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(400)
  })

  it('returns 400 when amount is not positive', async () => {
    const req = makePostRequest('escrow-1', { amount: -10, releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST — not found
// ============================================================================

describe('POST /api/payments/escrow/[id] — not found', () => {
  it('returns 404 when no active escrow found', async () => {
    // Make the select chain return empty
    const mockWhere = jest.fn().mockResolvedValue([])
    const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere })
    const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const req = makePostRequest('escrow-unknown', { amount: 100, releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-unknown'))
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// POST — permission check
// ============================================================================

describe('POST /api/payments/escrow/[id] — permission', () => {
  it('returns 401 when user is not buyer or admin', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-seller', email: 'seller@example.com', isStaff: false, staffPermissions: [] },
      expires: '2027-01-01',
    })
    const req = makePostRequest('escrow-1', { amount: 100, releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — amount validation
// ============================================================================

describe('POST /api/payments/escrow/[id] — amount exceeded', () => {
  it('returns 400 when release amount exceeds available balance', async () => {
    const req = makePostRequest('escrow-1', { amount: 200, releaseType: 'partial' }) // 200 CHF > 100 CHF available
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/payments/escrow/[id] — success', () => {
  it('returns 200 on full release', async () => {
    const { captureTransaction } = require('@/lib/payments/payrexx-client')
    const req = makePostRequest('escrow-1', { amount: 100, releaseType: 'full' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.releasedAmount).toBe(100)
    expect(captureTransaction).toHaveBeenCalled()
  })

  it('returns 200 on partial release', async () => {
    const { captureTransaction } = require('@/lib/payments/payrexx-client')
    const req = makePostRequest('escrow-1', { amount: 50, releaseType: 'partial' })
    const response = await POST(req, makeContext('escrow-1'))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.releasedAmount).toBe(50)
    expect(captureTransaction).toHaveBeenCalled()
  })
})
