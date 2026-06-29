/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/conversation (pre-acceptance chat).
 * Locked behaviours:
 *  - 401 when unauthenticated
 *  - requester → offerer: 200 when the target has an offer, 403 when not
 *  - technician (non-owner) → requester: 200 on OPEN, 403 when not open
 */

const mockAuth = jest.fn()
const mockFindOrCreate = jest.fn()
const mockSelect = jest.fn()

jest.mock('@/auth', () => ({ auth: (...a: unknown[]) => mockAuth(...a) }))
jest.mock('@/lib/security/rate-limit', () => ({ rateLimiters: { messageCreate: () => true } }))
jest.mock('@/lib/it-hilfe/conversation', () => ({
  findOrCreateItHilfeConversation: (...a: unknown[]) => mockFindOrCreate(...a),
}))
jest.mock('@/db', () => ({ db: { select: (...a: unknown[]) => mockSelect(...a) } }))
jest.mock('@/db/schema', () => ({
  itHilfeRequests: { id: 'r_id', requesterId: 'r_requester', title: 'r_title', status: 'r_status' },
  itHilfeOffers: { id: 'o_id', requestId: 'o_req', helperId: 'o_helper' },
}))
jest.mock('@/config/error-messages', () => ({ ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized' } }))
jest.mock('@/config/it-hilfe', () => ({ REQUEST_STATUS: { OPEN: 'open' } }))
jest.mock('@/lib/logger', () => ({ logger: { error: jest.fn() } }))
jest.mock('drizzle-orm', () => ({ eq: (...a: unknown[]) => ({ eq: a }), and: (...a: unknown[]) => ({ and: a }) }))
jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_e: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

import { NextRequest } from 'next/server'
import { POST } from '../route'

const REQUESTER = 'req-user'
const TECH = 'tech-user'

// db.select(...).from(...).where(...) → resolves to the mocked rows for that call.
function selectReturning(rows: unknown[]) {
  return { from: () => ({ where: () => Promise.resolve(rows) }) }
}
function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/it-hilfe/requests/r1/conversation', {
    method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' },
  })
}
const ctx = { params: Promise.resolve({ id: 'r1' }) }

beforeEach(() => {
  jest.clearAllMocks()
  mockFindOrCreate.mockResolvedValue('conv-1')
})

it('401 when unauthenticated', async () => {
  mockAuth.mockResolvedValue(null)
  const res = await POST(makeReq({}), ctx)
  expect(res.status).toBe(401)
})

it('requester → offerer with an offer: 200 + conversationId', async () => {
  mockAuth.mockResolvedValue({ user: { id: REQUESTER } })
  mockSelect
    .mockReturnValueOnce(selectReturning([{ requesterId: REQUESTER, title: 'Fix laptop', status: 'open' }]))
    .mockReturnValueOnce(selectReturning([{ id: 'offer-1' }])) // the offer exists
  const res = await POST(makeReq({ withUserId: TECH }), ctx)
  expect(res.status).toBe(200)
  expect((await res.json()).data.conversationId).toBe('conv-1')
  expect(mockFindOrCreate).toHaveBeenCalled()
})

it('requester → user without an offer: 403', async () => {
  mockAuth.mockResolvedValue({ user: { id: REQUESTER } })
  mockSelect
    .mockReturnValueOnce(selectReturning([{ requesterId: REQUESTER, title: 'x', status: 'open' }]))
    .mockReturnValueOnce(selectReturning([])) // no offer
  const res = await POST(makeReq({ withUserId: TECH }), ctx)
  expect(res.status).toBe(403)
  expect(mockFindOrCreate).not.toHaveBeenCalled()
})

it('technician → requester on OPEN request: 200', async () => {
  mockAuth.mockResolvedValue({ user: { id: TECH } })
  mockSelect.mockReturnValueOnce(selectReturning([{ requesterId: REQUESTER, title: 'x', status: 'open' }]))
  const res = await POST(makeReq({}), ctx)
  expect(res.status).toBe(200)
})

it('technician → requester on non-open request: 403', async () => {
  mockAuth.mockResolvedValue({ user: { id: TECH } })
  mockSelect.mockReturnValueOnce(selectReturning([{ requesterId: REQUESTER, title: 'x', status: 'matched' }]))
  const res = await POST(makeReq({}), ctx)
  expect(res.status).toBe(403)
})
