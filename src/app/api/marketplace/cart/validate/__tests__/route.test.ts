/**
 * @jest-environment node
 *
 * Tests for POST /api/marketplace/cart/validate
 *
 * Behaviors locked:
 * - 429 when rate limited
 * - 400 on invalid body (empty list, non-uuid ids)
 * - 200 with unavailable_ids = ids missing from the active+revampit set
 * - 200 with empty unavailable_ids when everything is still available
 */

const mockRateLimit = jest.fn().mockReturnValue(true)

jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: {
    listingBrowse: (...args: unknown[]) => mockRateLimit.apply(null, args),
  },
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
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
    apiRateLimited: () =>
      NextResponse.json({ success: false, error: 'Zu viele Anfragen' }, { status: 429 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: (...a: unknown[]) => mockWhere(...a) }) }),
  },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const ID_A = '11111111-1111-4111-8111-111111111111'
const ID_B = '22222222-2222-4222-8222-222222222222'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/marketplace/cart/validate', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimit.mockReturnValue(true)
})

describe('POST /api/marketplace/cart/validate', () => {
  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockReturnValue(false)
    const res = await POST(makeRequest({ listing_ids: [ID_A] }))
    expect(res.status).toBe(429)
  })

  it('returns 400 on empty id list', async () => {
    const res = await POST(makeRequest({ listing_ids: [] }))
    expect(res.status).toBe(400)
  })

  it('returns 400 on non-uuid ids', async () => {
    const res = await POST(makeRequest({ listing_ids: ['not-a-uuid'] }))
    expect(res.status).toBe(400)
  })

  it('flags ids missing from the active set as unavailable', async () => {
    mockWhere.mockResolvedValue([{ id: ID_A }])
    const res = await POST(makeRequest({ listing_ids: [ID_A, ID_B] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.unavailable_ids).toEqual([ID_B])
  })

  it('returns empty unavailable_ids when all items are available', async () => {
    mockWhere.mockResolvedValue([{ id: ID_A }, { id: ID_B }])
    const res = await POST(makeRequest({ listing_ids: [ID_A, ID_B] }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data.unavailable_ids).toEqual([])
  })
})
