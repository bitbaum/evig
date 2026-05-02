/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept
 */

// ── Auth mock ──────────────────────────────────────────────────────────────

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// ── DB mocks ───────────────────────────────────────────────────────────────

const mockExecute = jest.fn()
const mockTransaction = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockExecute(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema/itHilfe', () => ({
  itHilfeRequests: { id: 'ihr_id', requesterId: 'ihr_requesterId', status: 'ihr_status', matchedOfferId: 'ihr_matchedOfferId' },
  itHilfeOffers: { id: 'iho_id', requestId: 'iho_requestId', helperId: 'iho_helperId', status: 'iho_status' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/db/schema/messaging', () => ({
  conversations: { id: 'conv_id' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  getTableName: (_t: unknown) => 'table_name',
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

jest.mock('@/config/database', () => ({
  CONVERSATION_TYPES: { IT_HILFE: 'it_hilfe' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', IN_DISCUSSION: 'in_discussion', MATCHED: 'matched', COMPLETED: 'completed' },
  OFFER_STATUS: { PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn' },
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeOfferAccepted: jest.fn().mockReturnValue({}),
  itHilfeOfferRejected: jest.fn().mockReturnValue({}),
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

// ── Fixtures ───────────────────────────────────────────────────────────────

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const VALID_OFFER_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}
const MOCK_REQUEST_ROW = {
  requester_id: 'user-1',
  requester_name: 'Test User',
  status: 'open',
  title: 'Fix laptop',
}
const MOCK_OFFER_ROW = {
  id: VALID_OFFER_UUID,
  helper_id: 'helper-1',
  helper_name: 'Helper',
  helper_email: 'helper@example.com',
  status: 'pending',
}

// ── Imports (after mocks) ──────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ── Helpers ────────────────────────────────────────────────────────────────

const routeParams = (id: string, offerId: string) => ({
  params: Promise.resolve({ id, offerId }),
})

function makeRequest(id: string, offerId: string) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers/${offerId}/accept`, {
    method: 'POST',
  })
}

function setupSuccessExecute() {
  // tx execute for conversation check + notification
  const txExecute = jest.fn().mockResolvedValue({ rows: [] })
  const txUpdate = jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }) })
  const txInsert = jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) })
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
    return fn({ update: txUpdate, insert: txInsert, execute: txExecute })
  })
  // fire-and-forget rejected helpers notification
  mockExecute
    .mockResolvedValueOnce({ rows: [MOCK_REQUEST_ROW] })   // request query
    .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] })     // offer query
    .mockResolvedValue({ rows: [] })                        // subsequent fire-and-forget calls
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/it-hilfe/requests/[id]/offers/[offerId]/accept', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateWhere.mockResolvedValue(undefined)
    mockSet.mockReturnValue({ where: mockUpdateWhere })
    mockValues.mockResolvedValue(undefined)
  })

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid UUID', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)

    const res = await POST(makeRequest('bad-id', VALID_OFFER_UUID), routeParams('bad-id', VALID_OFFER_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 404 when request not found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute
      .mockResolvedValueOnce({ rows: [] })      // request not found
      .mockResolvedValueOnce({ rows: [] })      // offer result (not reached)

    const res = await POST(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 403 when user is not the requester', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute
      .mockResolvedValueOnce({ rows: [{ requester_id: 'other-user', requester_name: 'Other', status: 'open', title: 'X' }] })
      .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] })

    const res = await POST(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(403)
  })

  it('returns 400 when request status is not open or in_discussion', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockExecute
      .mockResolvedValueOnce({ rows: [{ requester_id: 'user-1', requester_name: 'Test', status: 'completed', title: 'X' }] })
      .mockResolvedValueOnce({ rows: [MOCK_OFFER_ROW] })

    const res = await POST(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    expect(res.status).toBe(400)
  })

  it('returns 200 when offer is accepted successfully', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    setupSuccessExecute()

    const res = await POST(makeRequest(VALID_UUID, VALID_OFFER_UUID), routeParams(VALID_UUID, VALID_OFFER_UUID))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
  })
})
