/**
 * @jest-environment node
 *
 * Tests for POST /api/appointments/book-with-payment
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 404 (service not found), 400 (no price), 201 with booking + payment URL
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  serviceTypes: {
    id: 'st_id', name: 'st_name', slug: 'st_slug', priceCents: 'st_priceCents',
    durationMinutes: 'st_durationMinutes', requiresApproval: 'st_requiresApproval', isActive: 'st_isActive',
  },
  serviceAppointments: {
    id: 'sa_id', userId: 'sa_userId', serviceTypeId: 'sa_serviceTypeId', description: 'sa_description',
    deviceInfo: 'sa_deviceInfo', urgency: 'sa_urgency', preferredDate: 'sa_preferredDate',
    status: 'sa_status', priceChargedCents: 'sa_priceChargedCents', createdAt: 'sa_createdAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), { raw: (s: string) => ({ __raw: s }) }),
  desc: (a: unknown) => ({ __desc: a }),
  isNull: (a: unknown) => ({ __isNull: a }),
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
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockValidateBody = jest.fn((_schema: unknown, data: unknown) => ({ success: true, data }))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  BookWithPaymentSchema: {},
}))

jest.mock('@/config/appointment-status', () => ({
  APPOINTMENT_STATUS: {
    CONFIRMED: 'confirmed', COMPLETED: 'completed', REQUESTED: 'requested',
    PENDING_APPROVAL: 'pending_approval',
  },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'http://localhost:3000',
}))

jest.mock('@/lib/payments/payment-flow', () => ({
  processPayment: jest.fn().mockResolvedValue({
    paymentUrl: 'https://pay.example.com/xyz',
    transactionId: 'txn-2',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-001',
    totalAmountCents: 8000,
    currency: 'CHF',
  }),
  buildInvoiceLineItem: jest.fn((name: string, cents: number) => ({ name, cents })),
  centsToDisplay: jest.fn((cents: number) => (cents / 100).toFixed(2)),
  DEFAULT_AUTO_RELEASE_DAYS: 7,
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_SERVICE = {
  id: 'svc-1',
  name: 'Laptop Repair',
  slug: 'laptop-repair',
  priceCents: 8000,
  durationMinutes: 60,
  requiresApproval: false,
}

const MOCK_CREATED_APPOINTMENT = {
  id: 'appt-new',
  createdAt: new Date(),
}

const DEFAULT_BOOKING_BODY = {
  serviceSlug: 'laptop-repair',
  description: 'Laptop screen broken',
  urgency: 'normal',
  useEscrow: false,
}

function makeServiceSelectChain(rows: unknown[]) {
  const where = jest.fn().mockResolvedValue(rows)
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockImplementation((_schema: unknown, data: unknown) => ({ success: true, data }))
  mockSelect.mockReturnValue(makeServiceSelectChain([MOCK_SERVICE]))
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([MOCK_CREATED_APPOINTMENT])

  const { processPayment, centsToDisplay, buildInvoiceLineItem } = jest.requireMock('@/lib/payments/payment-flow')
  processPayment.mockResolvedValue({
    paymentUrl: 'https://pay.example.com/xyz',
    transactionId: 'txn-2',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-001',
    totalAmountCents: 8000,
    currency: 'CHF',
  })
  centsToDisplay.mockImplementation((cents: number) => (cents / 100).toFixed(2))
  buildInvoiceLineItem.mockImplementation((name: string, cents: number) => ({ name, cents }))
})

// ============================================================================
// POST — book with payment
// ============================================================================

describe('POST /api/appointments/book-with-payment — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/appointments/book-with-payment — service not found', () => {
  it('returns 404 when service type does not exist', async () => {
    mockSelect.mockReturnValueOnce(makeServiceSelectChain([]))
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/appointments/book-with-payment — price validation', () => {
  it('returns 400 when service has no price set', async () => {
    mockSelect.mockReturnValueOnce(makeServiceSelectChain([{ ...MOCK_SERVICE, priceCents: 0 }]))
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/Preis/)
  })

  it('returns 400 when service price is null/falsy', async () => {
    mockSelect.mockReturnValueOnce(makeServiceSelectChain([{ ...MOCK_SERVICE, priceCents: null }]))
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

describe('POST /api/appointments/book-with-payment — success', () => {
  it('returns 200 with appointmentId, paymentUrl and invoiceId', async () => {
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.appointmentId).toBe('appt-new')
    expect(body.data.paymentUrl).toBe('https://pay.example.com/xyz')
    expect(body.data.invoiceId).toBe('inv-1')
  })

  it('returns confirmed status for services not requiring approval', async () => {
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    const body = await response.json()
    expect(body.data.status).toBe('confirmed')
    expect(body.data.message).toMatch(/erfolgreich verarbeitet/)
  })

  it('returns pending_approval status for services requiring approval', async () => {
    mockSelect.mockReturnValueOnce(makeServiceSelectChain([{ ...MOCK_SERVICE, requiresApproval: true }]))
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_BOOKING_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    const body = await response.json()
    expect(body.data.status).toBe('pending_approval')
    expect(body.data.message).toMatch(/Genehmigung/)
  })

  it('includes escrow info when useEscrow is true', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { ...DEFAULT_BOOKING_BODY, useEscrow: true },
    })
    const req = new NextRequest('http://localhost/api/appointments/book-with-payment', {
      method: 'POST',
      body: JSON.stringify({ ...DEFAULT_BOOKING_BODY, useEscrow: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    const body = await response.json()
    expect(body.data.escrowEnabled).toBe(true)
  })
})
