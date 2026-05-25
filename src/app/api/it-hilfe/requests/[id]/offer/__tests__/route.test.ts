/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/requests/[id]/offers
 * (Technician submits offer for a repair request)
 *
 * This tests the POST handler of the offers route
 * focusing on the key offer-submission behaviors:
 *   - 401 (not authenticated)
 *   - 404 (request not found)
 *   - 400 (already offered / own request)
 *   - 201 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  itHilfeRequests: {
    id: 'ihr_id',
    requesterId: 'ihr_requesterId',
    status: 'ihr_status',
    title: 'ihr_title',
    offerCount: 'ihr_offerCount',
    expiresAt: 'ihr_expiresAt',
  },
  itHilfeOffers: {
    id: 'iho_id',
    requestId: 'iho_requestId',
    helperId: 'iho_helperId',
    message: 'iho_message',
    estimatedTime: 'iho_estimatedTime',
    proposedCompensation: 'iho_proposedCompensation',
    relevantSkills: 'iho_relevantSkills',
    repairerProfileId: 'iho_repairerProfileId',
    status: 'iho_status',
    createdAt: 'iho_createdAt',
  },
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    isActive: 'rp_isActive',
    businessName: 'rp_businessName',
    isVerified: 'rp_isVerified',
    averageRating: 'rp_averageRating',
    totalReviews: 'rp_totalReviews',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  CreateOfferSchema: {},
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

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/it-hilfe', () => ({
  REQUEST_STATUS: { OPEN: 'open', MATCHED: 'matched', COMPLETED: 'completed' },
  OFFER_STATUS: { PENDING: 'pending', ACCEPTED: 'accepted', REJECTED: 'rejected', WITHDRAWN: 'withdrawn' },
}))

jest.mock('@/lib/it-hilfe/notifications', () => ({
  sendItHilfeNotification: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email', () => ({
  sendCustomEmail: jest.fn().mockResolvedValue({ success: true }),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeNewOfferReceived: jest.fn().mockReturnValue({}),
}))

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { offerCreate: jest.fn().mockReturnValue(true) },
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'https://example.com' }))

import { NextRequest } from 'next/server'
// Import from the actual offers route (the path /offer does not exist; /offers is the real route)
import { POST } from '../../offers/route'

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_REQUEST_DATA = {
  requesterId: 'other-user',
  status: 'open',
  title: 'Fix my laptop',
  requester_name: 'Jane',
  requester_email: 'jane@example.com',
}

function routeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(id: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/it-hilfe/requests/${id}/offers`, {
    method: 'POST',
    ...(body ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } } : {}),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateBody.mockReturnValue({
    success: true,
    data: { message: 'I can help', estimatedTime: null, proposedCompensation: null, relevantSkills: [] },
  })
  mockUpdateWhere.mockResolvedValue(undefined)
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockReturning.mockResolvedValue([{ id: 'offer-new' }])
  mockValues.mockReturnValue({ returning: mockReturning })

  const { rateLimiters } = jest.requireMock('@/lib/security/rate-limit') as { rateLimiters: { offerCreate: jest.Mock } }
  rateLimiters.offerCreate.mockReturnValue(true)
  // Re-wire fire-and-forget mocks that need .catch() to not throw
  const emailMocks = jest.requireMock('@/lib/email') as { sendCustomEmail: jest.Mock }
  emailMocks.sendCustomEmail.mockResolvedValue({ success: true })
  const notifyMocks = jest.requireMock('@/lib/it-hilfe/notifications') as { sendItHilfeNotification: jest.Mock }
  notifyMocks.sendItHilfeNotification.mockResolvedValue(undefined)
})

describe('POST /api/it-hilfe/requests/[id]/offers — offer submission', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const res = await POST(makeRequest(VALID_UUID, { message: 'help' }), routeParams(VALID_UUID))
    expect(res.status).toBe(401)
  })

  it('returns 404 when request does not exist', async () => {
    // Request+user join returns empty
    mockSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      }),
    })
    const res = await POST(makeRequest(VALID_UUID, { message: 'help' }), routeParams(VALID_UUID))
    expect(res.status).toBe(404)
  })

  it('returns 400 when user tries to offer on their own request', async () => {
    mockSelect.mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ ...MOCK_REQUEST_DATA, requesterId: 'user-1' }]),
        }),
      }),
    })
    const res = await POST(makeRequest(VALID_UUID, { message: 'help' }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/eigene/i)
  })

  it('returns 400 when user has already submitted an offer', async () => {
    // 1. Request+user join — open request, different owner
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([MOCK_REQUEST_DATA]),
        }),
      }),
    })
    // 2. Expiry check — not expired
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    // 3. Existing offer check — already exists
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ id: 'existing-offer' }]),
      }),
    })
    const res = await POST(makeRequest(VALID_UUID, { message: 'help' }), routeParams(VALID_UUID))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/bereits/i)
  })

  it('returns 201 when offer is submitted successfully', async () => {
    // 1. Request+user join — open, different owner
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([MOCK_REQUEST_DATA]),
        }),
      }),
    })
    // 2. Expiry check — not expired
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    // 3. Existing offer check — none
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })
    // 4. Repairer profile check — none
    mockSelect.mockReturnValueOnce({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([]),
      }),
    })

    const res = await POST(makeRequest(VALID_UUID, { message: 'I can help' }), routeParams(VALID_UUID))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.offerId).toBe('offer-new')
  })
})
