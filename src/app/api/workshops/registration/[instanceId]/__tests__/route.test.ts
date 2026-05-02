/**
 * @jest-environment node
 *
 * Tests for GET /api/workshops/registration/[instanceId] (optional auth)
 *
 * Behaviors locked:
 *   GET - 200 {registered: false, requiresAuth: true} when unauthenticated
 *         200 {registered: false, canRegister: true} when authenticated but not registered
 *         200 {registered: true, registration: {...}} when registered
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  workshopRegistrations: {
    id: 'wr_id', userId: 'wr_userId',
    workshopInstanceId: 'wr_workshopInstanceId',
    status: 'wr_status', createdAt: 'wr_createdAt',
  },
  workshopInstances: {
    id: 'wi_id', workshopId: 'wi_workshopId',
    startDate: 'wi_startDate', location: 'wi_location',
  },
  workshops: {
    id: 'ws_id', title: 'ws_title', slug: 'ws_slug',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal server error' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
  }
})

import { NextRequest } from 'next/server'
import { GET } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User' },
  expires: '2027-01-01',
}

const MOCK_REGISTRATION = {
  id: 'reg-1',
  status: 'confirmed',
  createdAt: new Date('2026-05-01T08:00:00Z'),
  startDate: new Date('2026-06-01T10:00:00Z'),
  location: 'Bern',
  workshopTitle: 'Linux Einführung',
  workshopSlug: 'linux-einfuehrung',
}

// Build a query chain with innerJoins and where clause
function makeRegistrationQueryChain(reg: unknown) {
  const where = jest.fn().mockResolvedValue(reg ? [reg] : [])
  const innerJoin2 = jest.fn().mockReturnValue({ where })
  const innerJoin1 = jest.fn().mockReturnValue({ innerJoin: innerJoin2 })
  const from = jest.fn().mockReturnValue({ innerJoin: innerJoin1 })
  return { from }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(null) // unauthenticated by default
})

// ============================================================================
// GET — unauthenticated
// ============================================================================

describe('GET /api/workshops/registration/[instanceId] — unauthenticated', () => {
  it('returns 200 with {registered: false, requiresAuth: true} when no session', async () => {
    const req = new NextRequest('http://localhost/api/workshops/registration/instance-1')
    const response = await GET(req, { params: Promise.resolve({ instanceId: 'instance-1' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.registered).toBe(false)
    expect(body.data.requiresAuth).toBe(true)
  })
})

// ============================================================================
// GET — not registered
// ============================================================================

describe('GET /api/workshops/registration/[instanceId] — not registered', () => {
  it('returns 200 with {registered: false, canRegister: true} when no registration found', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockSelect.mockReturnValue(makeRegistrationQueryChain(null))

    const req = new NextRequest('http://localhost/api/workshops/registration/instance-1')
    const response = await GET(req, { params: Promise.resolve({ instanceId: 'instance-1' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.registered).toBe(false)
    expect(body.data.canRegister).toBe(true)
  })
})

// ============================================================================
// GET — registered
// ============================================================================

describe('GET /api/workshops/registration/[instanceId] — registered', () => {
  it('returns 200 with registration details when user is registered', async () => {
    mockAuth.mockResolvedValue(MOCK_SESSION)
    mockSelect.mockReturnValue(makeRegistrationQueryChain(MOCK_REGISTRATION))

    const req = new NextRequest('http://localhost/api/workshops/registration/instance-1')
    const response = await GET(req, { params: Promise.resolve({ instanceId: 'instance-1' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.registered).toBe(true)
    expect(body.data.registration.id).toBe('reg-1')
    expect(body.data.registration.status).toBe('confirmed')
    expect(body.data.registration.workshop_instance.workshop_title).toBe('Linux Einführung')
    expect(body.data.registration.workshop_instance.workshop_slug).toBe('linux-einfuehrung')
  })
})
