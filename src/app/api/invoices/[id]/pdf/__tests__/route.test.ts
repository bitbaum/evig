/**
 * @jest-environment node
 *
 * Tests for GET /api/invoices/[id]/pdf (generate and return PDF buffer)
 *       and POST /api/invoices/[id]/pdf (generate and store PDF URL)
 *
 * Behaviors locked:
 *   GET  - 401, 404, 401 (not owner), 200 (PDF buffer)
 *   POST - 401, 404, 401 (not owner), 200 (pdfUrl)
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
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  invoices: {
    id: 'inv_id', invoiceNumber: 'inv_number', type: 'inv_type', status: 'inv_status',
    userId: 'inv_userId', orderId: 'inv_orderId', serviceAppointmentId: 'inv_serviceAppointmentId',
    workshopRegistrationId: 'inv_workshopRegistrationId', subtotalCents: 'inv_subtotalCents',
    taxCents: 'inv_taxCents', discountCents: 'inv_discountCents', totalCents: 'inv_totalCents',
    currency: 'inv_currency', taxRate: 'inv_taxRate', lineItems: 'inv_lineItems',
    billingAddress: 'inv_billingAddress', shippingAddress: 'inv_shippingAddress',
    issueDate: 'inv_issueDate', dueDate: 'inv_dueDate', paidAt: 'inv_paidAt',
    pdfUrl: 'inv_pdfUrl', pdfGeneratedAt: 'inv_pdfGeneratedAt', emailedAt: 'inv_emailedAt',
    emailRecipient: 'inv_emailRecipient', notes: 'inv_notes', paymentTerms: 'inv_paymentTerms',
    createdAt: 'inv_createdAt', updatedAt: 'inv_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  userProfiles: {
    userId: 'up_userId', firstName: 'up_firstName', lastName: 'up_lastName',
    phone: 'up_phone', addressLine1: 'up_addressLine1', city: 'up_city',
    postalCode: 'up_postalCode', country: 'up_country',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

const mockGenerateInvoicePDF = jest.fn()

jest.mock('@/lib/invoices/pdf-template', () => ({
  generateInvoicePDF: (...args: unknown[]) => mockGenerateInvoicePDF(...args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

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

const MOCK_INVOICE_DATA = {
  id: 'invoice-1',
  invoice_number: 'INV-2026-001',
  type: 'service',
  status: 'sent',
  user_id: 'user-1',
  order_id: null,
  service_appointment_id: null,
  workshop_registration_id: null,
  subtotal_cents: 10000,
  tax_cents: 770,
  discount_cents: 0,
  total_cents: 10770,
  currency: 'CHF',
  tax_rate: '0.077',
  line_items: [],
  billing_address: null,
  shipping_address: null,
  issue_date: new Date('2026-01-01'),
  due_date: new Date('2026-02-01'),
  paid_at: null,
  pdf_url: null,
  pdf_generated_at: null,
  emailed_at: null,
  email_recipient: null,
  notes: null,
  payment_terms: null,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  customer_name: 'Test User',
  customer_email: 'user@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: null,
  customer_address: { street: null, city: null, postal_code: null, country: null },
}

const MOCK_PDF_BUFFER = Buffer.from('%PDF-1.4 mock pdf content')

function makeContext(id = 'invoice-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(method = 'GET') {
  return new NextRequest(`http://localhost/api/invoices/invoice-1/pdf`, { method })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockGenerateInvoicePDF.mockResolvedValue(MOCK_PDF_BUFFER)

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockWhere.mockResolvedValue([MOCK_INVOICE_DATA])
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockInnerJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin, where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
})

// ============================================================================
// GET /api/invoices/[id]/pdf — unauthenticated
// ============================================================================

describe('GET /api/invoices/[id]/pdf — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/invoices/[id]/pdf — not found / forbidden
// ============================================================================

describe('GET /api/invoices/[id]/pdf — not found / forbidden', () => {
  it('returns 404 when invoice does not exist', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 401 when user does not own invoice', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_DATA, user_id: 'other-user' }])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// GET /api/invoices/[id]/pdf — success
// ============================================================================

describe('GET /api/invoices/[id]/pdf — success', () => {
  it('returns 200 with PDF content-type header', async () => {
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/pdf')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    expect(mockGenerateInvoicePDF).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('allows staff to generate PDF for another users invoice', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_STAFF_SESSION)
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_DATA, user_id: 'other-user' }])
    const req = makeRequest('GET')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// POST /api/invoices/[id]/pdf — unauthenticated
// ============================================================================

describe('POST /api/invoices/[id]/pdf — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = makeRequest('POST')
    const response = await POST(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/invoices/[id]/pdf — not found / forbidden
// ============================================================================

describe('POST /api/invoices/[id]/pdf — not found / forbidden', () => {
  it('returns 404 when invoice does not exist', async () => {
    mockWhere.mockResolvedValueOnce([])
    const req = makeRequest('POST')
    const response = await POST(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 401 when user does not own invoice', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_INVOICE_DATA, user_id: 'other-user' }])
    const req = makeRequest('POST')
    const response = await POST(req, makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/invoices/[id]/pdf — success
// ============================================================================

describe('POST /api/invoices/[id]/pdf — success', () => {
  it('returns 200 with pdfUrl', async () => {
    const req = makeRequest('POST')
    const response = await POST(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.pdfUrl).toContain('/api/invoices/invoice-1/pdf')
    expect(mockGenerateInvoicePDF).toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalled()
  })
})
