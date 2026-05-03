/**
 * @jest-environment node
 *
 * Tests for POST /api/invoices (create invoice) and GET /api/invoices (list invoices)
 *
 * Behaviors locked:
 *   POST - 401 (unauthenticated), 400 (invalid body), 201/200 (success with tax calculation)
 *   GET  - 401 (unauthenticated), 200 (list invoices)
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
const mockOrderBy = jest.fn()
const mockLimit = jest.fn()
const mockOffset = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  invoices: {
    id: 'inv_id', invoiceNumber: 'inv_number', type: 'inv_type', status: 'inv_status',
    userId: 'inv_userId', totalCents: 'inv_totalCents', subtotalCents: 'inv_subtotalCents',
    taxCents: 'inv_taxCents', currency: 'inv_currency', dueDate: 'inv_dueDate',
    issueDate: 'inv_issueDate', createdAt: 'inv_createdAt', updatedAt: 'inv_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  ilike: (a: unknown, b: unknown) => ({ __ilike: [a, b] }),
  getTableColumns: () => ({}),
}))

const mockCalculateTaxes = jest.fn()

jest.mock('@/lib/payments/tax-compliance', () => ({
  calculateTaxes: (...args: unknown[]) => mockCalculateTaxes(...args),
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
  CreateInvoiceSchema: {},
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
import { POST, GET } from '../route'

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

const MOCK_LINE_ITEMS = [
  { description: 'Repair service', quantity: 1, unitPrice: 100 },
]

const MOCK_TAX_CALCULATION = {
  subtotal: 100,
  vatAmount: 7.7,
  total: 107.7,
  vatRate: 0.077,
  regime: 'swiss' as const,
  currency: 'CHF' as const,
  breakdown: {
    taxableAmount: 100,
    vatExemptAmount: 0,
    reverseChargeAmount: 0,
  },
}

const MOCK_INVOICE = {
  id: 'invoice-1',
  invoiceNumber: 'INV-2026-001',
  createdAt: new Date('2026-01-01'),
}

const MOCK_INVOICE_ROW = {
  id: 'invoice-1',
  invoice_number: 'INV-2026-001',
  type: 'service',
  status: 'draft',
  user_id: 'user-1',
  total_cents: 10770,
  subtotal_cents: 10000,
  tax_cents: 770,
  currency: 'CHF',
  due_date: null,
  issue_date: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  customer_name: 'Test User',
  customer_email: 'user@example.com',
  total: '107.70',
  subtotal: '100.00',
  tax: '7.70',
}

function makeRequest(method = 'GET', body?: unknown, url = 'http://localhost/api/invoices') {
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Default tax calculation
  mockCalculateTaxes.mockReturnValue(MOCK_TAX_CALCULATION)

  // Default validateBody — success
  mockValidateBody.mockReturnValue({
    success: true,
    data: {
      type: 'service',
      lineItems: MOCK_LINE_ITEMS,
      taxRate: 0.077,
      currency: 'CHF',
      customerCountry: 'CH',
      customerType: 'consumer',
      businessType: 'service',
    },
  })

  // Default execute (generate_invoice_number)
  mockExecute.mockResolvedValue({ rows: [{ num: 'INV-2026-001' }] })

  // Default insert chain: values -> returning -> [MOCK_INVOICE]
  mockReturning.mockResolvedValue([MOCK_INVOICE])
  mockValues.mockReturnValue({ returning: mockReturning })

  // Default select chain for GET /api/invoices
  // Route calls: db.select().from().innerJoin().where().orderBy().limit().offset(n)
  // then second: db.select().from().where() — terminal call resolves
  mockOffset.mockResolvedValue([MOCK_INVOICE_ROW])
  mockLimit.mockReturnValue({ offset: mockOffset })
  mockOrderBy.mockReturnValue({ limit: mockLimit, offset: mockOffset })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy, limit: mockLimit })
  mockInnerJoin.mockReturnValue({ where: mockWhere, orderBy: mockOrderBy })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
})

// ============================================================================
// POST /api/invoices — unauthenticated
// ============================================================================

describe('POST /api/invoices — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('POST', { lineItems: MOCK_LINE_ITEMS })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/invoices — validation
// ============================================================================

describe('POST /api/invoices — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid body' }, { status: 400 }),
    })
    const req = makeRequest('POST', {})
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST /api/invoices — success
// ============================================================================

describe('POST /api/invoices — success', () => {
  it('creates invoice with tax calculation and returns 200', async () => {
    const req = makeRequest('POST', { lineItems: MOCK_LINE_ITEMS })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.invoiceNumber).toBe('INV-2026-001')
    expect(mockCalculateTaxes).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })

  it('uses targetUserId from session when not admin', async () => {
    const req = makeRequest('POST', { lineItems: MOCK_LINE_ITEMS })
    await POST(req)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' })
    )
  })

  it('allows admin to override userId', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: {
        type: 'service',
        userId: 'other-user-123',
        lineItems: MOCK_LINE_ITEMS,
        taxRate: 0.077,
        currency: 'CHF',
        customerCountry: 'CH',
        customerType: 'consumer',
        businessType: 'service',
      },
    })
    const req = makeRequest('POST', { lineItems: MOCK_LINE_ITEMS, userId: 'other-user-123' })
    const response = await POST(req)
    expect(response.status).toBe(200)
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'other-user-123' })
    )
  })
})

// ============================================================================
// GET /api/invoices — unauthenticated
// ============================================================================

describe('GET /api/invoices — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req)
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/invoices — success
// ============================================================================

describe('GET /api/invoices — success', () => {
  it('returns 200 with invoice list for regular user', async () => {
    // Route makes two selects:
    // 1) main: .from().innerJoin().where().orderBy().limit().offset(n) -> [rows]
    // 2) count: .from().where() -> [{ total: N }]
    // We set up the default chain for call #1 (offset resolves to rows)
    // and override mockWhere to also handle call #2 (where resolves to count)
    let selectCallCount = 0
    mockSelect.mockImplementation(() => {
      selectCallCount++
      if (selectCallCount === 1) {
        // main query chain
        return { from: mockFrom }
      }
      // count query: db.select({ total: sql... }).from(invoices).where(where)
      const mockCountWhere = jest.fn().mockResolvedValue([{ total: '1' }])
      const mockCountFrom = jest.fn().mockReturnValue({ where: mockCountWhere })
      return { from: mockCountFrom }
    })

    const req = makeRequest('GET')
    const response = await GET(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty('invoices')
    expect(body.data.total).toBe(1)
  })
})
