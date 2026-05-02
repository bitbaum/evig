/**
 * @jest-environment node
 *
 * Tests for GET /api/pools/[id] (public) and DELETE /api/pools/[id] (owner or superAdmin)
 *
 * Behaviors locked:
 *   GET    - 404, 200
 *   DELETE - 401, 404, 403 (not owner), 200 (owner), 200 (superAdmin)
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
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockLimit = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
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
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { GET, DELETE } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, isSuperAdmin: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_POOL = {
  id: 'pool-1', serviceName: 'Netflix', serviceCategory: 'streaming', maxMembers: 5,
  monthlyCostChf: '15', costPerMemberChf: '3', status: 'active', description: null, rules: null,
  createdAt: new Date(), ownerId: 'user-1', ownerName: 'Test User', memberCount: 1,
}

function makeContext(id = 'pool-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  const from = jest.fn()
  from.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ limit: mockLimit })
  mockLimit.mockResolvedValue([MOCK_POOL])
  mockSelect.mockReturnValue({ from })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
})

// ============================================================================
// GET — public detail
// ============================================================================

describe('GET /api/pools/[id] — public', () => {
  it('returns 404 when pool not found', async () => {
    mockLimit.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/api/pools/pool-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with pool detail', async () => {
    const req = new NextRequest('http://localhost/api/pools/pool-1')
    const response = await GET(req, makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.serviceName).toBe('Netflix')
  })
})

// ============================================================================
// DELETE — owner or superAdmin
// ============================================================================

describe('DELETE /api/pools/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/pools/pool-1', { method: 'DELETE' })
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/pools/[id] — validation', () => {
  it('returns 404 when pool not found', async () => {
    mockLimit.mockResolvedValueOnce([])
    const req = new NextRequest('http://localhost/api/pools/pool-1', { method: 'DELETE' })
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when not the owner', async () => {
    mockLimit.mockResolvedValueOnce([{ ...MOCK_POOL, ownerId: 'other-user' }])
    const req = new NextRequest('http://localhost/api/pools/pool-1', { method: 'DELETE' })
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/pools/[id] — success', () => {
  it('returns 200 when owner deletes pool', async () => {
    const req = new NextRequest('http://localhost/api/pools/pool-1', { method: 'DELETE' })
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalled()
  })

  it('returns 200 when superAdmin deletes pool', async () => {
    mockAuth.mockResolvedValueOnce({ ...MOCK_SESSION, user: { ...MOCK_SESSION.user, id: 'admin-1', isSuperAdmin: true } })
    mockLimit.mockResolvedValueOnce([{ ...MOCK_POOL, ownerId: 'other-user' }])
    const req = new NextRequest('http://localhost/api/pools/pool-1', { method: 'DELETE' })
    const response = await DELETE(req, makeContext())
    expect(response.status).toBe(200)
  })
})
