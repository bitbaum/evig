/**
 * @jest-environment node
 *
 * Tests for PATCH /api/workshops/registrations/[id] (authenticated)
 *
 * Behaviors locked:
 *   PATCH - 401 (unauthenticated)
 *           400 (invalid rating)
 *           404 (registration not found / not owned)
 *           200 (feedback/rating update)
 *           200 (cancel registration)
 *           400 (already cancelled)
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
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockReturning = jest.fn()
const mockExecute = jest.fn().mockResolvedValue({ rows: [] })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    execute: (...args: unknown[]) => mockExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshopRegistrations: {
    id: 'wr_id', userId: 'wr_userId',
    status: 'wr_status', feedback: 'wr_feedback',
    rating: 'wr_rating', cancelledAt: 'wr_cancelledAt',
    updatedAt: 'wr_updatedAt',
    workshopInstanceId: 'wr_workshopInstanceId',
    paymentStatus: 'wr_paymentStatus',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/workshop-registration-status', () => ({
  WORKSHOP_REGISTRATION_STATUS: {
    PENDING: 'pending', CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled', ATTENDED: 'attended',
  },
  WORKSHOP_PAYMENT_STATUS: {
    NOT_REQUIRED: 'not_required',
    PENDING: 'pending',
    PAID: 'paid',
    REFUNDED: 'refunded',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

// Build update chain: set → where → returning
function makeUpdateChain(rows: unknown[]) {
  mockReturning.mockResolvedValue(rows)
  const where = jest.fn().mockReturnValue({ returning: mockReturning })
  mockSet.mockReturnValue({ where })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  makeUpdateChain([{ id: 'reg-1' }])
  mockExecute.mockResolvedValue({ rows: [] })
})

// ============================================================================
// 401 — unauthenticated
// ============================================================================

describe('PATCH /api/workshops/registrations/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// 400 — invalid rating
// ============================================================================

describe('PATCH /api/workshops/registrations/[id] — invalid rating', () => {
  it('returns 400 when rating is out of range', async () => {
    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 6 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bewertung/i)
  })

  it('returns 400 when rating is 0', async () => {
    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 0 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// 200 — feedback/rating update
// ============================================================================

describe('PATCH /api/workshops/registrations/[id] — update feedback', () => {
  it('returns 200 when updating feedback', async () => {
    makeUpdateChain([{ id: 'reg-1' }])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({ feedback: 'Sehr lehrreich!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns 200 when updating rating', async () => {
    makeUpdateChain([{ id: 'reg-1' }])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 5 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns 404 when feedback update finds no matching registration', async () => {
    makeUpdateChain([])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({ feedback: 'Gut!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// 200 — cancel registration (default action)
// ============================================================================

describe('PATCH /api/workshops/registrations/[id] — cancel', () => {
  it('returns 200 when cancelling registration (empty body)', async () => {
    makeUpdateChain([{ id: 'reg-1' }])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns 400 when registration not found or already cancelled', async () => {
    makeUpdateChain([]) // no rows → already cancelled or not found

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits storniert/i)
  })

  it('returns 200 when cancelling without body', async () => {
    makeUpdateChain([{ id: 'reg-1' }])

    // Route catches JSON parse error and proceeds with body = null → cancel path
    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-1', {
      method: 'PATCH',
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-1' }) })
    expect(response.status).toBe(200)
  })

  it('decrements workshop_instances.current_participants when cancelling a paid registration (mirrors webhook fix eac01d4a)', async () => {
    // Paid registration: register-with-payment incremented current_participants
    // at INSERT — cancelling must decrement to avoid phantom-seat leak.
    makeUpdateChain([
      { id: 'reg-paid', workshopInstanceId: 'inst-42', paymentStatus: 'paid' },
    ])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-paid', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-paid' }) })
    expect(response.status).toBe(200)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('does NOT decrement when cancelling a free (not_required) registration — basic-register never incremented', async () => {
    // Free workshop registered via /api/workshops/register: no count
    // increment at INSERT, so cancelling must not decrement either.
    makeUpdateChain([
      { id: 'reg-free', workshopInstanceId: 'inst-42', paymentStatus: 'not_required' },
    ])

    const req = new NextRequest('http://localhost/api/workshops/registrations/reg-free', {
      method: 'PATCH',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PATCH(req, { params: Promise.resolve({ id: 'reg-free' }) })
    expect(response.status).toBe(200)
    expect(mockExecute).not.toHaveBeenCalled()
  })
})
