/**
 * @jest-environment node
 *
 * Tests for DELETE /api/it-hilfe/requests/[id]/offers/[offerId]
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockSelect = jest.fn()
const mockFrom = jest.fn()
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
  itHilfeOffers: { id: 'iho_id', requestId: 'iho_requestId', helperId: 'iho_helperId', status: 'iho_status' },
  itHilfeRequests: { id: 'ihr_id', offerCount: 'ihr_offerCount' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  OFFER_STATUS: { PENDING: 'pending', WITHDRAWN: 'withdrawn', ACCEPTED: 'accepted', REJECTED: 'rejected' },
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}
const MOCK_OFFER = {
  helperId: 'user-1',
  status: 'pending',
  requestId: VALID_UUID,
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { DELETE } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string, offerId: string) => ({
  params: Promise.resolve({ id, offerId }),
})

function makeRequest(id: string, offerId: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers/${offerId}`, {
    method: 'DELETE',
  })
}

function setupSelectChain(rows: unknown[]) {
  mockWhere.mockResolvedValue(rows)
  mockFrom.mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('DELETE /api/it-hilfe/requests/[id]/offers/[offerId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await DELETE(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await DELETE(makeRequest('bad-id', VALID_OFFER_UUID), routeParams('bad-id', VALID_OFFER_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid offerId', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await DELETE(makeRequest(VALID_UUID, 'bad-offer-id'), routeParams(VALID_UUID, 'bad-offer-id'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when offer not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([])

    const res = await DELETE(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the offer helper', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([{ helperId: 'other-user', status: 'pending', requestId: VALID_UUID }])

    const res = await DELETE(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(403)
  })

  it('returns 400 when offer is not pending', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([{ helperId: 'user-1', status: 'accepted', requestId: VALID_UUID }])

    const res = await DELETE(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 200 when offer is successfully withdrawn', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSelectChain([MOCK_OFFER])

    const res = await DELETE(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
