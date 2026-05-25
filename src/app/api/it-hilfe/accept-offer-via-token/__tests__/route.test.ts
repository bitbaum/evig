/**
 * @jest-environment node
 *
 * Tests for POST /api/it-hilfe/accept-offer-via-token
 *
 * The route delegates state changes to @/lib/it-hilfe/accept-offer and
 * token verification to @/lib/it-hilfe/offer-accept-tokens, so these tests
 * mock both modules and verify the route's response mapping for each
 * documented failure mode + the happy path.
 */

const mockVerify = jest.fn()
const mockLookup = jest.fn()
const mockAccept = jest.fn()

jest.mock('@/lib/it-hilfe/offer-accept-tokens', () => ({
  verifyOfferAcceptToken: (...args: unknown[]) => mockVerify(...args),
}))

jest.mock('@/lib/it-hilfe/accept-offer', () => ({
  acceptOffer: (...args: unknown[]) => mockAccept(...args),
  lookupOfferRequestId: (...args: unknown[]) => mockLookup(...args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const VALID_OFFER_ID = '11111111-2222-3333-4444-555555555555'
const VALID_REQUEST_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const VALID_HELPER_ID = '00000000-1111-2222-3333-444444444444'
const VALID_TOKEN = 'fake-token-string'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/it-hilfe/accept-offer-via-token', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// Happy path
// ============================================================================

describe('POST /api/it-hilfe/accept-offer-via-token — happy path', () => {
  it('accepts a valid token and returns 200 with requestId + helperId', async () => {
    mockVerify.mockReturnValueOnce({ ok: true, offerId: VALID_OFFER_ID, expiresAt: new Date() })
    mockLookup.mockResolvedValueOnce(VALID_REQUEST_ID)
    mockAccept.mockResolvedValueOnce({
      ok: true,
      requestId: VALID_REQUEST_ID,
      offerId: VALID_OFFER_ID,
      helperId: VALID_HELPER_ID,
    })

    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({
      success: true,
      data: { requestId: VALID_REQUEST_ID, helperId: VALID_HELPER_ID },
    })

    expect(mockVerify).toHaveBeenCalledWith(VALID_TOKEN)
    expect(mockLookup).toHaveBeenCalledWith(VALID_OFFER_ID)
    expect(mockAccept).toHaveBeenCalledWith({
      requestId: VALID_REQUEST_ID,
      offerId: VALID_OFFER_ID,
      acceptingUserId: null,
    })
  })
})

// ============================================================================
// Body validation
// ============================================================================

describe('body validation', () => {
  it('returns 400 when body is missing token field', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('returns 400 when token is not a string', async () => {
    const res = await POST(makeRequest({ token: 123 }))
    expect(res.status).toBe(400)
    expect(mockVerify).not.toHaveBeenCalled()
  })

  it('returns 400 when body is invalid JSON', async () => {
    const res = await POST(makeRequest('{ not json'))
    expect(res.status).toBe(400)
    expect(mockVerify).not.toHaveBeenCalled()
  })
})

// ============================================================================
// Token verify failures
// ============================================================================

describe('token verify failures', () => {
  it('returns 400 with reason=malformed when verify says malformed', async () => {
    mockVerify.mockReturnValueOnce({ ok: false, reason: 'malformed' })
    const res = await POST(makeRequest({ token: 'garbage' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.reason).toBe('malformed')
    expect(mockLookup).not.toHaveBeenCalled()
    expect(mockAccept).not.toHaveBeenCalled()
  })

  it('returns 410 with reason=expired when verify says expired', async () => {
    mockVerify.mockReturnValueOnce({ ok: false, reason: 'expired' })
    const res = await POST(makeRequest({ token: 'old-token' }))
    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.reason).toBe('expired')
  })

  it('returns 400 with reason=invalid_signature when verify says invalid_signature', async () => {
    mockVerify.mockReturnValueOnce({ ok: false, reason: 'invalid_signature' })
    const res = await POST(makeRequest({ token: 'tampered' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.reason).toBe('invalid_signature')
  })
})

// ============================================================================
// Offer lookup failures
// ============================================================================

describe('offer lookup', () => {
  it('returns 404 when the offer ID encoded in the token has no row', async () => {
    mockVerify.mockReturnValueOnce({ ok: true, offerId: VALID_OFFER_ID, expiresAt: new Date() })
    mockLookup.mockResolvedValueOnce(null)
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(404)
    expect(mockAccept).not.toHaveBeenCalled()
  })
})

// ============================================================================
// acceptOffer state failures (mapped to HTTP)
// ============================================================================

describe('acceptOffer state failures', () => {
  beforeEach(() => {
    mockVerify.mockReturnValue({ ok: true, offerId: VALID_OFFER_ID, expiresAt: new Date() })
    mockLookup.mockResolvedValue(VALID_REQUEST_ID)
  })

  it('returns 404 on request_not_found', async () => {
    mockAccept.mockResolvedValueOnce({ ok: false, reason: 'request_not_found' })
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(404)
    expect((await res.json()).reason).toBe('request_not_found')
  })

  it('returns 404 on offer_not_found', async () => {
    mockAccept.mockResolvedValueOnce({ ok: false, reason: 'offer_not_found' })
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(404)
    expect((await res.json()).reason).toBe('offer_not_found')
  })

  it('returns 409 on request_not_open (already matched/completed)', async () => {
    mockAccept.mockResolvedValueOnce({ ok: false, reason: 'request_not_open' })
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(409)
    expect((await res.json()).reason).toBe('request_not_open')
  })

  it('returns 409 on offer_not_pending (already accepted/rejected/withdrawn)', async () => {
    mockAccept.mockResolvedValueOnce({ ok: false, reason: 'offer_not_pending' })
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(409)
    expect((await res.json()).reason).toBe('offer_not_pending')
  })

  it('returns 403 on not_authorized (defensive — should not happen with null acceptingUserId)', async () => {
    mockAccept.mockResolvedValueOnce({ ok: false, reason: 'not_authorized' })
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(403)
    expect((await res.json()).reason).toBe('not_authorized')
  })
})

// ============================================================================
// Unexpected errors
// ============================================================================

describe('unexpected errors', () => {
  it('returns 500 when acceptOffer throws', async () => {
    mockVerify.mockReturnValueOnce({ ok: true, offerId: VALID_OFFER_ID, expiresAt: new Date() })
    mockLookup.mockResolvedValueOnce(VALID_REQUEST_ID)
    mockAccept.mockRejectedValueOnce(new Error('db connection lost'))
    const res = await POST(makeRequest({ token: VALID_TOKEN }))
    expect(res.status).toBe(500)
  })
})
