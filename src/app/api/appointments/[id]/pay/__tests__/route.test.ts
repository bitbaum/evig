/**
 * @jest-environment node
 *
 * Tests for POST /api/appointments/[id]/pay
 *
 * Behaviors locked:
 *   POST - 401, 404, 401 (not owner), 400 (wrong status), 400 (already paid), 400 (zero amount), 200
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
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
  serviceAppointments: {
    id: 'sa_id', userId: 'sa_userId', repairerId: 'sa_repairerId',
    serviceTypeId: 'sa_serviceTypeId', status: 'sa_status',
    priceChargedCents: 'sa_priceChargedCents', updatedAt: 'sa_updatedAt',
  },
  serviceTypes: { id: 'st_id', name: 'st_name', slug: 'st_slug', priceCents: 'st_priceCents', requiresApproval: 'st_requiresApproval' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
  paymentTransactions: {
    id: 'pt_id', serviceAppointmentId: 'pt_serviceAppointmentId',
    amountCents: 'pt_amountCents', status: 'pt_status', type: 'pt_type',
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
  validateBody: (schema: unknown, data: unknown) => mockValidateBody(schema, data),
  PayAppointmentSchema: {},
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { SUCCEEDED: 'succeeded', PENDING: 'pending' },
  PAYMENT_TRANSACTION_TYPE: { PAYMENT: 'payment' },
}))

jest.mock('@/config/appointment-status', () => ({
  APPOINTMENT_STATUS: { CONFIRMED: 'confirmed', COMPLETED: 'completed', REQUESTED: 'requested' },
}))

jest.mock('@/config/booking-status', () => ({
  BOOKING_STATUS: {
    REQUESTED: 'requested',
    QUOTE_APPROVED: 'quote_approved',
    IN_PROGRESS: 'in_progress',
  },
  isPayableBookingStatus: (status: string) => ['quote_approved', 'in_progress'].includes(status),
}))

jest.mock('@/config/service-appointments', () => ({
  SERVICE_APPOINTMENT_ROUTES: {
    detail: (id: string) => `/dashboard/appointments/${id}`,
  },
}))

jest.mock('@/lib/payments/payment-flow', () => ({
  processPaymentWithoutInvoice: jest.fn().mockResolvedValue({
    paymentUrl: 'https://pay.example.com/abc',
    transactionId: 'txn-1',
    totalAmountCents: 5000,
    currency: 'CHF',
  }),
  centsToDisplay: jest.fn((cents: number) => (cents / 100).toFixed(2)),
  DEFAULT_AUTO_RELEASE_DAYS: 7,
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_APPOINTMENT = {
  id: 'appt-1',
  user_id: 'user-1',
  status: 'quote_approved',
  price_charged_cents: 5000,
  quoted_price_chf: 50,
  service_price_cents: 5000,
  service_name: 'Laptop Repair',
  service_slug: 'laptop-repair',
  requires_approval: false,
  customer_name: 'Test User',
  customer_email: 'user@example.com',
}

const DEFAULT_PAY_BODY = {
  useEscrow: false,
  autoReleaseDays: 7,
  paymentType: 'full',
}

function makeSelectChain(rows: unknown[]) {
  const where = jest.fn().mockResolvedValue(rows)
  const innerJoin = jest.fn()
  // innerJoin is called twice: after from, then after first innerJoin
  // Both subsequent calls should return { innerJoin, where }
  innerJoin.mockReturnValue({ innerJoin, where })
  const from = jest.fn().mockReturnValue({ innerJoin, where })
  return { from }
}

function makeCountChain(totalPaid: number) {
  const where = jest.fn().mockResolvedValue([{ total_paid: totalPaid }])
  const from = jest.fn().mockReturnValue({ where })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockImplementation((_schema: unknown, data: unknown) => ({ success: true, data }))
  mockSelect.mockReturnValue(makeSelectChain([MOCK_APPOINTMENT]))
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  const { processPaymentWithoutInvoice, centsToDisplay } = jest.requireMock('@/lib/payments/payment-flow')
  processPaymentWithoutInvoice.mockResolvedValue({
    paymentUrl: 'https://pay.example.com/abc',
    transactionId: 'txn-1',
    totalAmountCents: 5000,
    currency: 'CHF',
  })
  centsToDisplay.mockImplementation((cents: number) => (cents / 100).toFixed(2))
})

// ============================================================================
// POST — pay for appointment
// ============================================================================

describe('POST /api/appointments/[id]/pay — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/appointments/[id]/pay — not found', () => {
  it('returns 404 when appointment does not exist', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(404)
  })
})

describe('POST /api/appointments/[id]/pay — authorization', () => {
  it('returns 401 when user does not own the appointment and is not staff', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([{ ...MOCK_APPOINTMENT, user_id: 'other-user' }]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })

  it('allows staff to pay on behalf of customer', async () => {
    mockAuth.mockResolvedValueOnce({ ...MOCK_SESSION, user: { ...MOCK_SESSION.user, id: 'admin-1', isStaff: true } })
    mockSelect.mockReturnValueOnce(makeSelectChain([{ ...MOCK_APPOINTMENT, user_id: 'other-user' }]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
  })
})

describe('POST /api/appointments/[id]/pay — status validation', () => {
  it('returns 400 when appointment is not in a payable status', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([{ ...MOCK_APPOINTMENT, status: 'requested' }]))
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when remaining payment is already fully paid', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { useEscrow: false, autoReleaseDays: 7, paymentType: 'remaining' },
    })

    // First select returns appointment, second returns paid total equal to appointment amount
    mockSelect
      .mockReturnValueOnce(makeSelectChain([{ ...MOCK_APPOINTMENT, price_charged_cents: 5000 }]))
      .mockReturnValueOnce(makeCountChain(5000))

    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify({ useEscrow: false, autoReleaseDays: 7, paymentType: 'remaining' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits vollständig bezahlt/)
  })
})

describe('POST /api/appointments/[id]/pay — success', () => {
  it('returns 200 with payment URL for full payment', async () => {
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify(DEFAULT_PAY_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.paymentUrl).toBe('https://pay.example.com/abc')
    expect(body.data.paymentType).toBe('full')
  })

  it('returns 200 for deposit payment (30%)', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { useEscrow: false, autoReleaseDays: 7, paymentType: 'deposit' },
    })

    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify({ useEscrow: false, autoReleaseDays: 7, paymentType: 'deposit' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const { processPaymentWithoutInvoice } = jest.requireMock('@/lib/payments/payment-flow')
    const callArgs = processPaymentWithoutInvoice.mock.calls[0][0]
    // 30% of 5000 = 1500
    expect(callArgs.baseAmountCents).toBe(1500)
  })

  it('returns 200 with escrow message when useEscrow=true', async () => {
    mockValidateBody.mockReturnValueOnce({
      success: true,
      data: { useEscrow: true, autoReleaseDays: 7, paymentType: 'full' },
    })

    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify({ useEscrow: true, autoReleaseDays: 7, paymentType: 'full' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toMatch(/treuhänderisch/)
  })

  it('redirect URLs land on appointment detail page with payment query params', async () => {
    const req = new NextRequest('http://localhost/api/appointments/appt-1/pay', {
      method: 'POST',
      body: JSON.stringify({ useEscrow: false, autoReleaseDays: 7, paymentType: 'full' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    const { processPaymentWithoutInvoice } = jest.requireMock('@/lib/payments/payment-flow')
    const callArgs = processPaymentWithoutInvoice.mock.calls[0][0]
    expect(callArgs.successRedirectUrl).toMatch(/\/dashboard\/appointments\/appt-1\?payment=success$/)
    expect(callArgs.failedRedirectUrl).toMatch(/\/dashboard\/appointments\/appt-1\?payment=failed$/)
    expect(callArgs.cancelRedirectUrl).toMatch(/\/dashboard\/appointments\/appt-1\?payment=cancelled$/)
  })
})
