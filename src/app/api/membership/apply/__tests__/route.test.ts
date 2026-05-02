/**
 * @jest-environment node
 *
 * Tests for POST /api/membership/apply (public, optional auth)
 *
 * Behaviors locked:
 *   POST - 429 (rate limited), 400 (invalid body), 400 (already member),
 *          200 (success anonymous), 200 (success logged in)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockCheckRateLimit = jest.fn()
const mockGetClientIp = jest.fn()

jest.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
}))

const mockSendCustomEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail(...args),
}))

jest.mock('@/config/org', () => ({
  BANK: { iban: 'CH00 0000 0000 0000 0000 0', name: 'Test Bank', accountHolder: 'RevampIT' },
  MEMBERSHIP: { fees: { regular: 60, reduced: 30 } },
  ORG: { name: 'RevampIT', legalName: 'RevampIT' },
}))

jest.mock('@/config/membership-status', () => ({
  MEMBERSHIP_APPLICATION_STATUS: { APPROVED: 'approved', PENDING: 'pending', REJECTED: 'rejected' },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockLimit = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  users: {
    id: 'u_id',
    isMember: 'u_isMember',
    email: 'u_email',
    memberSince: 'u_memberSince',
    memberType: 'u_memberType',
  },
  membershipApplications: {
    id: 'ma_id',
    userId: 'ma_userId',
    applicantName: 'ma_applicantName',
    applicantEmail: 'ma_applicantEmail',
    addressStreet: 'ma_addressStreet',
    addressPostalCode: 'ma_addressPostalCode',
    addressCity: 'ma_addressCity',
    memberType: 'ma_memberType',
    status: 'ma_status',
    reviewedAt: 'ma_reviewedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/utils/escape-html', () => ({
  escapeHtml: (s: string) => s,
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiRateLimited: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 429 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const VALID_BODY = {
  applicantName: 'Test Person',
  applicantEmail: 'test@example.com',
  addressStreet: 'Teststrasse 1',
  addressPostalCode: '8000',
  addressCity: 'Zürich',
  memberType: 'regular',
}

beforeEach(() => {
  jest.resetAllMocks()

  mockAuth.mockResolvedValue(null) // anonymous by default
  mockGetClientIp.mockReturnValue('127.0.0.1')
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 10, resetAt: 0 })

  // Fire-and-forget: must return a Promise so .catch() works
  mockSendCustomEmail.mockResolvedValue(undefined)

  // Default select chain: no existing user
  mockLimit.mockResolvedValue([])
  mockWhere.mockReturnValue({ limit: mockLimit })
  mockFrom.mockReturnValue({ where: mockWhere })
  mockSelect.mockReturnValue({ from: mockFrom })

  // Default insert chain: returns application id
  mockReturning.mockResolvedValue([{ id: 'app-1' }])
  mockValues.mockReturnValue({ returning: mockReturning })

  // update chain
  const mockWhere2 = jest.fn().mockResolvedValue(undefined)
  mockSet.mockReturnValue({ where: mockWhere2 })
})

// ============================================================================
// POST — rate limiting
// ============================================================================

describe('POST /api/membership/apply — rate limiting', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/membership/apply — validation', () => {
  it('returns 400 when body is invalid (missing required fields)', async () => {
    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify({ applicantName: 'A' }), // too short, missing fields
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when postal code is invalid format', async () => {
    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify({ ...VALID_BODY, addressPostalCode: 'ABCD' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST — already a member
// ============================================================================

describe('POST /api/membership/apply — already member', () => {
  it('returns 400 when logged-in user is already a member', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'member@example.com', isMember: true },
      expires: '2027-01-01',
    })

    // First select: check membership → user IS a member
    mockLimit.mockResolvedValueOnce([{ isMember: true }])

    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits Mitglied/i)
  })
})

// ============================================================================
// POST — success (anonymous)
// ============================================================================

describe('POST /api/membership/apply — success anonymous', () => {
  it('returns 200 with application id when submitted anonymously', async () => {
    // anonymous — no session
    mockAuth.mockResolvedValueOnce(null)

    // select for user by email: no user found
    mockLimit.mockResolvedValueOnce([])

    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('app-1')
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// POST — success (logged in)
// ============================================================================

describe('POST /api/membership/apply — success logged in', () => {
  it('returns 200 and activates membership for logged-in user', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-2', email: 'logged@example.com' },
      expires: '2027-01-01',
    })

    // select for membership check: user is NOT a member yet
    mockLimit.mockResolvedValueOnce([{ isMember: false }])

    const req = new NextRequest('http://localhost/api/membership/apply', {
      method: 'POST',
      body: JSON.stringify(VALID_BODY),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.memberType).toBe('regular')
    // insert for application + update for user membership
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })
})
