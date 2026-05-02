/**
 * @jest-environment node
 *
 * Tests for POST /api/pools/[id]/join (authenticated)
 *
 * Behaviors locked:
 *   POST - 401, 404, 400 (inactive pool), 400 (pool full), 400 (already active member),
 *          200 (re-join — reactivates left membership), 201 (new membership)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
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
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockUpdateReturning = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockInsertReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  subscriptionPools: { id: 'sp_id', maxMembers: 'sp_maxMembers', status: 'sp_status', ownerId: 'sp_ownerId' },
  poolMemberships: { id: 'pm_id', poolId: 'pm_poolId', userId: 'pm_userId', role: 'pm_role', status: 'pm_status', leftAt: 'pm_leftAt' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
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
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_POOL = { id: 'pool-1', maxMembers: 5, status: 'active', memberCount: 2 }
const MOCK_MEMBERSHIP = { id: 'mem-1', poolId: 'pool-1', userId: 'user-1', role: 'member', status: 'active' }

function makeContext(id = 'pool-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest() {
  return new NextRequest('http://localhost/api/pools/pool-1/join', { method: 'POST' })
}

// Persistent mock references so tests can override specific step results
let mockPoolLimit: jest.Mock
let mockMemberLimit: jest.Mock

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Pool select chain (first db.select call)
  mockPoolLimit = jest.fn().mockResolvedValue([MOCK_POOL])
  const poolWhere = jest.fn().mockReturnValue({ limit: mockPoolLimit })
  const poolFrom = jest.fn().mockReturnValue({ where: poolWhere })

  // Membership select chain (second db.select call)
  mockMemberLimit = jest.fn().mockResolvedValue([]) // no existing membership by default
  const memberWhere = jest.fn().mockReturnValue({ limit: mockMemberLimit })
  const memberFrom = jest.fn().mockReturnValue({ where: memberWhere })

  mockSelect.mockReturnValueOnce({ from: poolFrom })
  mockSelect.mockReturnValue({ from: memberFrom })

  // Update chain (re-activate left membership)
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockUpdateReturning.mockResolvedValue([MOCK_MEMBERSHIP])

  // Insert chain (new membership)
  mockValues.mockReturnValue({ returning: mockInsertReturning })
  mockInsertReturning.mockResolvedValue([MOCK_MEMBERSHIP])
})

describe('POST /api/pools/[id]/join — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/pools/[id]/join — validation', () => {
  it('returns 404 when pool not found', async () => {
    mockPoolLimit.mockResolvedValueOnce([])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when pool is not active', async () => {
    mockPoolLimit.mockResolvedValueOnce([{ ...MOCK_POOL, status: 'closed' }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht aktiv/i)
  })

  it('returns 400 when pool is full', async () => {
    mockPoolLimit.mockResolvedValueOnce([{ ...MOCK_POOL, memberCount: 5, maxMembers: 5 }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/voll/i)
  })

  it('returns 400 when already an active member', async () => {
    mockMemberLimit.mockResolvedValueOnce([{ id: 'mem-1', status: 'active' }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits Mitglied/i)
  })
})

describe('POST /api/pools/[id]/join — success', () => {
  it('returns 200 (reactivates left membership)', async () => {
    mockMemberLimit.mockResolvedValueOnce([{ id: 'mem-1', status: 'left' }])
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('returns 201 (new membership created)', async () => {
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(201)
    expect(mockInsert).toHaveBeenCalled()
  })
})
