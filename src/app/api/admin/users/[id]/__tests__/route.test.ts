/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/users/[id]
 *
 * Behaviors locked:
 *   GET /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 404 when user not found
 *   - returns 200 with user details
 *
 *   PATCH /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 400 when body is invalid
 *   - returns 404 when user not found
 *   - returns 400 when no fields to update
 *   - returns 200 on success
 *
 *   DELETE /api/admin/users/[id]
 *   - returns 401 when not authenticated
 *   - returns 403 when not a super admin
 *   - returns 404 when user not found
 *   - returns 403 when trying to delete a super admin
 *   - returns 400 when trying to delete self
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
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockOnConflictDoUpdate = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockValidateBody = jest.fn()
const mockIsSuperAdmin = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  users: {
    id: 'u_id', name: 'u_name', email: 'u_email', isStaff: 'u_isStaff',
    isSuperAdmin: 'u_isSuperAdmin', staffPermissions: 'u_staffPerms',
    createdAt: 'u_createdAt', emailVerified: 'u_emailVerified',
  },
  userProfiles: { userId: 'up_userId', phone: 'up_phone', addressLine1: 'up_address' },
  sessions: { userId: 'sess_userId' },
  accounts: { userId: 'acc_userId' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
  SUPER_ADMIN_EMAILS: ['protected@revamp-it.ch'],
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminUpdateUserSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
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
import { GET, PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_USER = { id: 'user-1', name: 'Hans', email: 'hans@example.com', is_staff: false }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/users/user-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'user-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockIsSuperAdmin.mockReturnValue(true)

  // GET uses leftJoin; PATCH/DELETE use direct where on users
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_USER])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate })
  mockOnConflictDoUpdate.mockResolvedValue(undefined)

  mockDeleteWhere.mockResolvedValue(undefined)

  mockValidateBody.mockReturnValue({ success: true, data: { name: 'New Name' } })
})

// ============================================================================
// GET /api/admin/users/[id]
// ============================================================================

describe('GET /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(403)
  })
})

describe('GET /api/admin/users/[id] — authenticated', () => {
  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with user details', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.user.id).toBe('user-1')
  })
})

// ============================================================================
// PATCH /api/admin/users/[id]
// ============================================================================

describe('PATCH /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext())
    expect(response.status).toBe(403)
  })
})

describe('PATCH /api/admin/users/[id] — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { name: 'New' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when no fields to update', async () => {
    mockValidateBody.mockReturnValueOnce({ success: true, data: {} })
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/users/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await PATCH(makeRequest('PATCH', { name: 'New Name' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/admin/users/[id]
// ============================================================================

describe('DELETE /api/admin/users/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/users/[id] — authorization', () => {
  it('returns 403 when not a super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/admin/users/[id] — guards', () => {
  it('returns 404 when user not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 403 when trying to delete a protected super admin', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_USER, email: 'protected@revamp-it.ch' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(403)
  })

  it('returns 400 when trying to delete self', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_USER, id: 'admin-1' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext('admin-1'))
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/admin/users/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.message).toContain('hans@example.com')
  })
})
