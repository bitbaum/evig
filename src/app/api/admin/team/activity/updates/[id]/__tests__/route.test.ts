/**
 * @jest-environment node
 *
 * Tests for GET/PUT/DELETE /api/admin/team/activity/updates/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/team/activity/updates/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when update not found
 *   - returns 200 with update
 *
 *   PUT /api/admin/team/activity/updates/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when no fields to update
 *   - returns 404 when update not found
 *   - returns 200 on success
 *
 *   DELETE /api/admin/team/activity/updates/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when update not found
 *   - returns 200 on success
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (sectionOrHandler: unknown, maybeHandler?: unknown) => {
    const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler
    return (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockInnerJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockValidateUpdateActivityUpdate = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  activityUpdates: {
    id: 'au_id', userId: 'au_userId', updateType: 'au_updateType',
    title: 'au_title', description: 'au_description', category: 'au_category',
    visibility: 'au_visibility', occurredAt: 'au_occurredAt',
    createdAt: 'au_createdAt', updatedAt: 'au_updatedAt',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/schemas/activity', () => ({
  validateUpdateActivityUpdate: (...args: unknown[]) => mockValidateUpdateActivityUpdate.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_ROW = {
  id: 'upd-1', user_id: 'u-1', user_name: 'Hans', user_email: 'hans@example.com',
  update_type: 'progress', title: 'Fixed a bug', description: null,
  category: null, visibility: 'team', occurred_at: '2026-01-01',
  created_at: '2026-01-01', updated_at: '2026-01-01',
}

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/team/activity/updates/upd-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'upd-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_ROW])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
  mockDeleteWhere.mockResolvedValue(undefined)

  mockValidateUpdateActivityUpdate.mockReturnValue({ success: true, data: { title: 'Updated' } })
})

// ============================================================================
// GET /api/admin/team/activity/updates/[id]
// ============================================================================

describe('GET /api/admin/team/activity/updates/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/team/activity/updates/[id] — authenticated', () => {
  it('returns 404 when update not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with update', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('upd-1')
  })
})

// ============================================================================
// PUT /api/admin/team/activity/updates/[id]
// ============================================================================

describe('PUT /api/admin/team/activity/updates/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest('PUT', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/team/activity/updates/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateUpdateActivityUpdate.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when no fields to update', async () => {
    mockValidateUpdateActivityUpdate.mockReturnValueOnce({ success: true, data: {} })
    const response = await PUT(makeRequest('PUT', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when update not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PUT(makeRequest('PUT', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/admin/team/activity/updates/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest('PUT', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// DELETE /api/admin/team/activity/updates/[id]
// ============================================================================

describe('DELETE /api/admin/team/activity/updates/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/team/activity/updates/[id] — authenticated', () => {
  it('returns 404 when update not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1)
  })
})
