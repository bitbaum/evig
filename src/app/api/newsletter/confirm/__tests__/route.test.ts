/**
 * @jest-environment node
 *
 * Tests for GET /api/newsletter/confirm
 *
 * Mission-relevant: newsletter confirmation is the double-opt-in step.
 * The user clicks a link in their email and lands here via browser
 * navigation — so this route returns text/html (not JSON) so the
 * subscriber sees a friendly confirmation page rather than raw API
 * output.
 *
 * Behaviors locked:
 *   GET /api/newsletter/confirm
 *   - returns 400 HTML when token query param is missing
 *   - returns 400 HTML with "ungültig" / "verwendet" copy when token is invalid/already used
 *   - returns 200 HTML with success message when token is valid
 *   - calls DB update to set isActive=true, confirmToken=null
 *   - returns 500 HTML when DB throws
 *   - Content-Type is text/html for all responses
 */

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

jest.mock('@/config/org', () => ({
  ORG: { name: 'Revamp-IT' },
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revamp-it.test',
}))

import { NextRequest } from 'next/server'
import { GET } from '../route'

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

describe('GET /api/newsletter/confirm — missing token', () => {
  it('returns 400 HTML when token is missing', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toMatch(/text\/html/)
    const text = await response.text()
    expect(text.toLowerCase()).toContain('token')
  })
})

describe('GET /api/newsletter/confirm — invalid token', () => {
  it('returns 400 HTML when token not found (no matching DB row)', async () => {
    mockReturning.mockResolvedValueOnce([])
    const response = await GET(makeRequest('invalid-token-xyz'))
    expect(response.status).toBe(400)
    expect(response.headers.get('content-type')).toMatch(/text\/html/)
    const text = await response.text()
    expect(text).toMatch(/ungültig|verwendet/i)
  })
})

describe('GET /api/newsletter/confirm — valid token', () => {
  it('returns 200 HTML on success', async () => {
    const response = await GET(makeRequest('valid-token-abc'))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toMatch(/text\/html/)
  })

  it('success HTML contains confirmation copy and link back to homepage', async () => {
    const response = await GET(makeRequest('valid-token-abc'))
    const text = await response.text()
    expect(text).toMatch(/bestätigt/i)
    expect(text).toContain('https://revamp-it.test')
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
  it('returns 500 HTML when DB throws', async () => {
    mockReturning.mockRejectedValueOnce(new Error('DB connection lost'))
    const response = await GET(makeRequest('some-token'))
    expect(response.status).toBe(500)
    expect(response.headers.get('content-type')).toMatch(/text\/html/)
  })
})
