/**
 * @jest-environment node
 *
 * Tests for POST /api/workshops/[slug]/register-with-payment
 *
 * Behaviors locked:
 *   POST - 401, 400 (validation), 404 (workshop not found), 400 (full), 201 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockExecute = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    execute: (...args: unknown[]) => mockExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/db/schema/workshops', () => ({
  workshops: { id: 'w_id', title: 'w_title', price_cents: 'w_price_cents', slug: 'w_slug', is_active: 'w_is_active' },
  workshopInstances: { id: 'wi_id', status: 'wi_status', currentParticipants: 'wi_currentParticipants', maxParticipants: 'wi_maxParticipants' },
  workshopRegistrations: {
    id: 'wr_id',
    userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status',
    paymentStatus: 'wr_paymentStatus',
    paymentAmountCents: 'wr_paymentAmountCents',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  getTableName: () => 'mock_table',
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  WorkshopRegisterWithPaymentSchema: {},
}))

const mockProcessPayment = jest.fn()
const mockBuildInvoiceLineItem = jest.fn()
const mockCentsToDisplay = jest.fn()

jest.mock('@/lib/payments/payment-flow', () => ({
  processPayment: (...args: unknown[]) => mockProcessPayment(...args),
  buildInvoiceLineItem: (...args: unknown[]) => mockBuildInvoiceLineItem(...args),
  centsToDisplay: (...args: unknown[]) => mockCentsToDisplay(...args),
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

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ATTENDED: 'attended',
    CANCELLED: 'cancelled',
  },
}))

jest.mock('@/config/workshops', () => ({
  WORKSHOP_INSTANCE_STATUS: { SCHEDULED: 'scheduled', CANCELLED: 'cancelled', COMPLETED: 'completed' },
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { PENDING: 'pending', SUCCEEDED: 'succeeded' },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_WORKSHOP = {
  id: 'workshop-1',
  title: 'Linux Basics',
  price_cents: 2500,
  slug: 'linux-basics',
  is_active: true,
}

const VALID_BODY = {
  instanceId: null,
  useEscrow: false,
}

function makeRequest(slug = 'linux-basics', body?: unknown) {
  return new NextRequest(`http://localhost/api/workshops/${slug}/register-with-payment`, {
    method: 'POST',
    body: JSON.stringify(body ?? VALID_BODY),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockReturnValue({ success: true, data: VALID_BODY })
  mockBuildInvoiceLineItem.mockReturnValue({ description: 'Linux Basics', amount: 2500 })
  mockCentsToDisplay.mockReturnValue('CHF 25.00')
  mockProcessPayment.mockResolvedValue({
    paymentUrl: 'https://pay.example.com/pay/123',
    transactionId: 'tx-1',
    invoiceId: 'inv-1',
    invoiceNumber: 'INV-001',
    totalAmountCents: 2500,
    currency: 'CHF',
  })
  mockReturning.mockResolvedValue([{ id: 'reg-1' }])
  mockValues.mockReturnValue({ returning: mockReturning })
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    const txInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'reg-1' }]),
      }),
    })
    const txExecute = jest.fn().mockResolvedValue({ rows: [] })
    return fn({ insert: txInsert, execute: txExecute })
  })
})

describe('POST /api/workshops/[slug]/register-with-payment — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeRequest())
    expect(res.status).toBe(401)
  })
})

describe('POST /api/workshops/[slug]/register-with-payment — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Validation failed' }, { status: 400 }),
    })
    // workshop lookup
    mockExecute.mockResolvedValue({ rows: [MOCK_WORKSHOP] })

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns 404 when workshop not found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })

    const res = await POST(makeRequest())
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Workshop nicht gefunden')
  })

  it('returns 400 when workshop has no price', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ ...MOCK_WORKSHOP, price_cents: 0 }] })

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
  })

  it('returns 400 when workshop instance is full', async () => {
    const bodyWithInstance = { instanceId: 'instance-1', useEscrow: false }
    mockValidateBody.mockReturnValue({ success: true, data: bodyWithInstance })
    // Workshop found
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] })
    // Instance found but full
    mockExecute.mockResolvedValueOnce({
      rows: [{
        id: 'instance-1',
        title: 'Linux Basics',
        workshop_price: 2500,
        current_participants: 20,
        max_participants: 20,
        status: 'scheduled',
      }],
    })
    // Existing registration check
    mockWhere.mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await POST(makeRequest('linux-basics', bodyWithInstance))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/ausgebucht/i)
  })
})

describe('POST /api/workshops/[slug]/register-with-payment — success', () => {
  it('returns 200 with registration and payment URL', async () => {
    // Workshop found
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] })
    // Existing registration check — none
    mockWhere.mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.paymentUrl).toBe('https://pay.example.com/pay/123')
    expect(body.data.registrationId).toBe('reg-1')
    expect(body.data.workshopTitle).toBe('Linux Basics')
  })
})

describe('POST /api/workshops/[slug]/register-with-payment — existing registration', () => {
  it('returns 400 with clear message when prior PENDING registration is in flight (was 500 from UNIQUE conflict)', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] })
    // Existing PENDING row blocks the new payment flow
    mockWhere.mockResolvedValue([{ id: 'prior-reg', status: 'pending' }])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const res = await POST(makeRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/läuft bereits/i)
  })

  it('resurrects a CANCELLED registration via UPDATE instead of 500ing on UNIQUE conflict', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [MOCK_WORKSHOP] })
    mockWhere.mockResolvedValue([{ id: 'prior-reg', status: 'cancelled' }])
    mockFrom.mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    // Capture which path the transaction took: UPDATE (resurrect) vs INSERT
    const txInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValue([{ id: 'new-reg' }]),
      }),
    })
    const txUpdate = jest.fn().mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'prior-reg' }]),
        }),
      }),
    })
    const txExecute = jest.fn().mockResolvedValue({ rows: [] })
    mockTransaction.mockImplementationOnce(async (fn: (tx: unknown) => unknown) =>
      fn({ insert: txInsert, update: txUpdate, execute: txExecute })
    )

    const res = await POST(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    // Existing CANCELLED row resurrected — returned ID matches the prior row
    expect(body.data.registrationId).toBe('prior-reg')
    expect(txUpdate).toHaveBeenCalled()
    expect(txInsert).not.toHaveBeenCalled()
  })
})
