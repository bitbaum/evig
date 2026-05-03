/**
 * @jest-environment node
 *
 * Tests for GET /api/pools (public) and POST /api/pools (authenticated)
 *
 * Behaviors locked:
 *   GET  - 200 with pool list, 200 empty
 *   POST - 401, 400 (invalid body), 201 (creates pool + auto-joins owner)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockOrderBy = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  subscriptionPools: { id: 'sp_id', serviceName: 'sp_serviceName', serviceCategory: 'sp_serviceCategory', maxMembers: 'sp_maxMembers', monthlyCostChf: 'sp_monthlyCostChf', costPerMemberChf: 'sp_costPerMemberChf', status: 'sp_status', description: 'sp_description', rules: 'sp_rules', createdAt: 'sp_createdAt', ownerId: 'sp_ownerId' },
  poolMemberships: { id: 'pm_id', poolId: 'pm_poolId', userId: 'pm_userId', role: 'pm_role', status: 'pm_status' },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
  desc: (a: unknown) => ({ __desc: a }),
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { POOL_MEMBERSHIPS: 'pool_memberships' },
  POOL_STATUS: { ACTIVE: 'active', CLOSED: 'closed' },
  POOL_MEMBERSHIP_STATUS: { ACTIVE: 'active', LEFT: 'left' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiSuccessCached: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_POOL = {
  id: 'pool-1', serviceName: 'Netflix', serviceCategory: 'streaming', maxMembers: 5,
  monthlyCostChf: '15', costPerMemberChf: '3', status: 'active', description: null, rules: null,
  createdAt: new Date(), ownerName: 'Test User', memberCount: 1, spotsLeft: 4,
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  const from = jest.fn()
  from.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue([MOCK_POOL])
  mockSelect.mockReturnValue({ from })
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([MOCK_POOL])
})

// ============================================================================
// GET — public browse
// ============================================================================

describe('GET /api/pools — public', () => {
  it('returns 200 with pool list', async () => {
    const req = new NextRequest('http://localhost/api/pools')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data[0].serviceName).toBe('Netflix')
  })

  it('returns 200 with empty list', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/api/pools')
    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toEqual([])
  })
})

// ============================================================================
// POST — create pool
// ============================================================================

describe('POST /api/pools — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/pools', {
      method: 'POST',
      body: JSON.stringify({ serviceName: 'Netflix', serviceCategory: 'streaming', maxMembers: 4, monthlyCostChf: 15 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(401)
  })
})

describe('POST /api/pools — validation', () => {
  it('returns 400 when body is invalid (missing required fields)', async () => {
    const req = new NextRequest('http://localhost/api/pools', {
      method: 'POST',
      body: JSON.stringify({ serviceName: 'N' }), // too short, missing fields
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })

  it('returns 400 when serviceCategory is invalid', async () => {
    const req = new NextRequest('http://localhost/api/pools', {
      method: 'POST',
      body: JSON.stringify({ serviceName: 'Netflix', serviceCategory: 'invalid', maxMembers: 4, monthlyCostChf: 15 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

describe('POST /api/pools — success', () => {
  it('returns 201 with created pool and auto-joins owner', async () => {
    mockValues.mockReturnValueOnce({ returning: jest.fn().mockResolvedValue([MOCK_POOL]) }) // subscriptionPools insert
    mockValues.mockResolvedValueOnce(undefined) // poolMemberships insert (no returning)

    const req = new NextRequest('http://localhost/api/pools', {
      method: 'POST',
      body: JSON.stringify({ serviceName: 'Netflix', serviceCategory: 'streaming', maxMembers: 5, monthlyCostChf: 15 }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.serviceName).toBe('Netflix')
    // Both inserts were called (pool + membership)
    expect(mockInsert).toHaveBeenCalledTimes(2)
  })
})
