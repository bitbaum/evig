/**
 * @jest-environment node
 *
 * Tests for GET /api/newsletter/confirm
 *
 * Mission-relevant: newsletter confirmation is the double-opt-in step.
 * If this endpoint is broken, subscribers who click the email link get an
 * error and are never added to the active list — donor/volunteer outreach fails.
 *
 * Behaviors locked:
 *   GET /api/newsletter/confirm
 *   - returns 400 when token query param is missing
 *   - returns 400 with Swiss-German message when token is invalid/already used
 *   - returns 200 with success message when token is valid
 *   - calls DB update to set isActive=true, confirmToken=null
 *   - returns 500 error response when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockReturning = jest.fn()
const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning })
const mockSet = jest.fn().mockReturnValue({ where: mockWhere })
const mockUpdate = jest.fn().mockReturnValue({ set: mockSet })

jest.mock('@/db', () => ({
  db: {
    update: (...args: unknown[]) => mockUpdate.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  newsletterSubscriptions: {
    email: 'email',
    isActive: 'is_active',
    confirmedAt: 'confirmed_at',
    confirmToken: 'confirm_token',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'NOW()' }),
    { raw: jest.fn() },
  ),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  },
  apiBadRequest: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 400 })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(token?: string) {
  const url = new URL('http://localhost/api/newsletter/confirm')
  if (token !== undefined) url.searchParams.set('token', token)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.clearAllMocks()
  mockReturning.mockResolvedValue([{ email: 'hans@example.com' }])
  mockUpdate.mockReturnValue({ set: mockSet })
  mockSet.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ returning: mockReturning })
})

// ============================================================================
// GET /api/newsletter/confirm
// ============================================================================

describe('GET /api/newsletter/confirm — missing token', () => {
  it('returns 400 when token is missing', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
  })

  it('error message references token', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.error.toLowerCase()).toContain('token')
  })
})

describe('GET /api/newsletter/confirm — invalid token', () => {
  it('returns 400 when token not found (no matching DB row)', async () => {
    mockReturning.mockResolvedValueOnce([]) // empty = not found or already used

    const response = await GET(makeRequest('invalid-token-xyz'))
    expect(response.status).toBe(400)
  })

  it('error message mentions invalid or already used link', async () => {
    mockReturning.mockResolvedValueOnce([])

    const response = await GET(makeRequest('expired-token'))
    const body = await response.json()
    expect(body.error).toMatch(/ungültig|verwendet/i)
  })
})

describe('GET /api/newsletter/confirm — valid token', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest('valid-token-abc'))
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await GET(makeRequest('valid-token-abc'))
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('success message mentions newsletter confirmation', async () => {
    const response = await GET(makeRequest('valid-token-abc'))
    const body = await response.json()
    expect(body.data.message).toMatch(/newsletter|bestätigt/i)
  })

  it('calls db.update to activate subscription', async () => {
    await GET(makeRequest('valid-token-abc'))
    expect(mockUpdate).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, confirmToken: null }),
    )
  })
})

describe('GET /api/newsletter/confirm — DB error', () => {
  it('returns 500 when DB throws', async () => {
    mockReturning.mockRejectedValueOnce(new Error('DB connection lost'))

    const response = await GET(makeRequest('some-token'))
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})
