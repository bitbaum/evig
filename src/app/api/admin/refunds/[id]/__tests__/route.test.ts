/**
 * @jest-environment node
 *
 * Tests for GET/PUT /api/admin/refunds/[id]
 *
 * Behaviors locked:
 *   GET - 401, 404, 200
 *   PUT - 401, 400 (validateBody), 404, 400 (wrong status for approve), 200 (approve), 200 (reject)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockValidateBody = jest.fn()
const mockRefundTransaction = jest.fn()

// alias called at module init
jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_table: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name`, email: `${name}_email`, slug: `${name}_slug` }),
}))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  refunds: { id: 'r_id', status: 'r_status', refundNumber: 'r_refundNumber', originalTransactionId: 'r_originalTransactionId', amountCents: 'r_amountCents', currency: 'r_currency', reason: 'r_reason', requestedBy: 'r_requestedBy', approvedBy: 'r_approvedBy', processedBy: 'r_processedBy', refundTransactionId: 'r_refundTransactionId', internalNotes: 'r_internalNotes', createdAt: 'r_createdAt', approvedAt: 'r_approvedAt', processedAt: 'r_processedAt', customerNotes: 'r_customerNotes' },
  paymentTransactions: { id: 'pt_id', amountCents: 'pt_amountCents', currency: 'pt_currency', providerId: 'pt_providerId', providerTransactionId: 'pt_providerTransactionId' },
  paymentProviders: { id: 'pp_id', slug: 'pp_slug' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/refund', () => ({
  REFUND_STATUS: { REQUESTED: 'requested', APPROVED: 'approved', REJECTED: 'rejected', COMPLETED: 'completed', PROCESSING: 'processing' },
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_TRANSACTION_TYPE: { REFUND: 'refund' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  RefundActionSchema: {},
}))

jest.mock('@/lib/payments/payrexx-client', () => ({
  refundTransaction: (...args: unknown[]) => mockRefundTransaction.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, PUT } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_REFUND = {
  id: 'ref-1', status: 'requested', amountCents: 5000, reason: 'defect',
  requestedBy: 'u-1', refundNumber: 'R-001', originalTransactionId: 'tx-1',
  provider_transaction_id: 'payrexx-tx-123', currency: 'CHF', provider_id: 'prov-1', provider_slug: 'payrexx',
}

const MOCK_UPDATED = { id: 'ref-1', refundNumber: 'R-001', status: 'approved', amountCents: 5000, currency: 'CHF', reason: 'defect', internalNotes: null, createdAt: new Date(), approvedAt: new Date(), processedAt: null, customer_name: 'Hans', customer_email: 'hans@example.com' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/refunds/ref-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'ref-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // GET: from → innerJoin(users) → innerJoin(pt) → leftJoin(×3 aliases) → where (terminal)
  // PUT: fetch refund: from → innerJoin(pt) → innerJoin(pp) → where (terminal)
  //      fetch updated: from → innerJoin(users) → where (terminal)
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })
  mockInnerJoin.mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_REFUND])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockValidateBody.mockReturnValue({ success: true, data: { action: 'approve', notes: undefined } })
})

describe('GET /api/admin/refunds/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/refunds/[id] — authenticated', () => {
  it('returns 404 when refund not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with refund details', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.refund.id).toBe('ref-1')
  })
})

describe('PUT /api/admin/refunds/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest('PUT', { action: 'approve' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/refunds/[id] — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when refund not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PUT(makeRequest('PUT', { action: 'approve' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when approving a non-requested refund', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_REFUND, status: 'approved' }])
    const response = await PUT(makeRequest('PUT', { action: 'approve' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PUT /api/admin/refunds/[id] — success', () => {
  it('returns 200 on approve action', async () => {
    // First where: fetch refund (status=requested)
    // Second where: fetch updated refund
    mockWhere
      .mockResolvedValueOnce([MOCK_REFUND])
      .mockResolvedValueOnce([MOCK_UPDATED])
    const response = await PUT(makeRequest('PUT', { action: 'approve' }), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns 200 on reject action', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: { action: 'reject', notes: 'Not eligible' } })
    mockWhere
      .mockResolvedValueOnce([MOCK_REFUND])
      .mockResolvedValueOnce([{ ...MOCK_UPDATED, status: 'rejected' }])
    const response = await PUT(makeRequest('PUT', { action: 'reject', notes: 'Not eligible' }), makeContext())
    expect(response.status).toBe(200)
  })
})
