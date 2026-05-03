/**
 * @jest-environment node
 *
 * Tests for GET /api/invoices/[id], PUT /api/invoices/[id], DELETE /api/invoices/[id]
 *
 * Behaviors locked:
 *   GET    - 401, 404, 401 (not owner), 200
 *   PUT    - 401, 404, 400 (no valid fields), 200
 *   DELETE - 401, 404, 401 (not owner), 400 (not draft), 200
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
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  invoices: {
    id: 'inv_id', invoiceNumber: 'inv_number', type: 'inv_type', status: 'inv_status',
    userId: 'inv_userId', totalCents: 'inv_totalCents', subtotalCents: 'inv_subtotalCents',
    taxCents: 'inv_taxCents', currency: 'inv_currency', taxRate: 'inv_taxRate',
    lineItems: 'inv_lineItems', notes: 'inv_notes', dueDate: 'inv_dueDate',
    issueDate: 'inv_issueDate', billingAddress: 'inv_billingAddress',
    shippingAddress: 'inv_shippingAddress', paymentTerms: 'inv_paymentTerms',
    createdAt: 'inv_createdAt', updatedAt: 'inv_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
}))

jest.mock('@/config/invoice-status', () => ({
  INVOICE_STATUS: {
    DRAFT: 'draft',
    SENT: 'sent',
    PAID: 'paid',
    OVERDUE: 'overdue',
    CANCELLED: 'cancelled',
  },
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  UpdateInvoiceSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
    parsePagination: (_req: unknown) => ({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
    isSuperAdmin: false,
  },
  expires: '2027-01-01',
}

const MOCK_STAFF_SESSION = {
  user: {
    id: 'staff-1',
    email: 'admin@revamp-it.ch',
    name: 'Staff User',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const MOCK_INVOICE_DETAIL = {
  id: 'invoice-1',
  user_id: 'user-1',
  status: 'draft',
  invoice_number: 'INV-2026-001',
  type: 'service',
  total_cents: 10770,
  subtotal_cents: 10000,
  tax_cents: 770,
  currency: 'CHF',
  tax_rate: '0.077',
  line_items: [],
  notes: null,
  due_date: null,
  issue_date: null,
  billing_address: null,
  shipping_address: null,
  payment_terms: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  customer_name: 'Test User',
  customer_email: 'user@example.com',
  total: '107.70',
  subtotal: '100.00',
  tax: '7.70',
}

// Minimal invoice for ownership/status checks
const MOCK_INVOICE_STUB = {
  id: 'invoice-1',
  userId: 'user-1',
  status: 'draft',
}

function makeContext(id = 'invoice-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost/api/invoices/invoice-1`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateBody.mockReturnValue({
    success: true,
    data: { status: 'sent' },
  })

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([MOCK_INVOICE_DETAIL])
  mockDeleteWhere.mockResolvedValue(undefined)

  // Default select chain: supports both detail and stub fetches
  mockWhere.mockResolvedValue([MOCK_INVOICE_DETAIL])
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
})

// ============================================================================
// GET /api/invoices/[id] — unauthenticated
// ============================================================================

describe('GET /api/invoices/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/invoices/[id] — not found / forbidden
// ============================================================================

describe('GET /api/invoices/[id] — not found / forbidden', () => {
  it('returns 404 when invoice does not exist', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 401 when user does not own invoice', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_DETAIL, user_id: 'other-user' }])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/invoices/[id] — success
// ============================================================================

describe('GET /api/invoices/[id] — success', () => {
  it('returns 200 with invoice detail for owner', async () => {
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.invoice.invoice_number).toBe('INV-2026-001')
  })

  it('returns 200 for admin viewing another users invoice', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_DETAIL, user_id: 'other-user' }])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// PUT /api/invoices/[id] — unauthenticated
// ============================================================================

describe('PUT /api/invoices/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('PUT', { status: 'sent' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// PUT /api/invoices/[id] — validation
// ============================================================================

describe('PUT /api/invoices/[id] — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest('PUT', {})
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when invoice not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = makeRequest('PUT', { status: 'sent' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 401 when user does not own invoice', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_STUB, userId: 'other-user' }])
    const req = makeRequest('PUT', { status: 'sent' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(401)
  })

  it('returns 400 when no valid fields to update', async () => {
    mockWhere.mockResolvedValueOnce([MOCK_INVOICE_STUB])
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const req = makeRequest('PUT', {})
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// PUT /api/invoices/[id] — success
// ============================================================================

describe('PUT /api/invoices/[id] — success', () => {
  it('returns 200 with updated invoice', async () => {
    mockWhere
      .mockResolvedValueOnce([MOCK_INVOICE_STUB])   // ownership check
      .mockResolvedValueOnce([MOCK_INVOICE_DETAIL])  // fetch updated
    const req = makeRequest('PUT', { status: 'sent' })
    const response = await PUT(req, makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })
})

// ============================================================================
// DELETE /api/invoices/[id] — unauthenticated
// ============================================================================

describe('DELETE /api/invoices/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// DELETE /api/invoices/[id] — validation
// ============================================================================

describe('DELETE /api/invoices/[id] — validation', () => {
  it('returns 404 when invoice not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 401 when user does not own invoice', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_STUB, userId: 'other-user' }])
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(401)
  })

  it('returns 400 when invoice is not in draft status', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_STUB, status: 'sent' }])
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// DELETE /api/invoices/[id] — success
// ============================================================================

describe('DELETE /api/invoices/[id] — success', () => {
  it('returns 200 when owner deletes draft invoice', async () => {
    mockWhere.mockResolvedValueOnce([MOCK_INVOICE_STUB])
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(200)
    expect(mockDelete).toHaveBeenCalled()
  })

  it('allows admin to delete another users draft invoice', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_STUB, userId: 'other-user' }])
    const req = makeRequest('DELETE')
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(200)
  })
})
