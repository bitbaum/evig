/**
 * @jest-environment node
 *
 * Tests for PATCH /api/admin/users/[id]/permissions
 *
 * Behaviors locked:
 *   PATCH - 401, 403 (non-super-admin), 400 (validateBody), 404 (user not found),
 *           400 (demote hardcoded super admin), 400 (self-demotion), 200
 */

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
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockValidateBody = jest.fn()
const mockIsSuperAdmin = jest.fn()
const mockLogPermissionsChange = jest.fn()
const mockLogSuperAdminChange = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  users: { id: 'u_id', email: 'u_email', isSuperAdmin: 'u_isSuperAdmin', staffPermissions: 'u_staffPermissions', isStaff: 'u_isStaff' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
  ADMIN_SECTIONS: { dashboard: true, products: true, workshops: true, users: true },
  SUPER_ADMIN_EMAILS: ['andreas@revamp-it.ch'] as const,
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  AdminPermissionsSchema: {},
}))

jest.mock('@/lib/auth/audit', () => ({
  logPermissionsChange: (...args: unknown[]) => mockLogPermissionsChange.apply(null, args),
  logSuperAdminChange: (...args: unknown[]) => mockLogSuperAdminChange.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_TARGET_USER = {
  id: 'user-2', email: 'user@example.com', is_super_admin: false, staff_permissions: ['dashboard'],
}

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/users/user-2/permissions', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? { permissions: ['dashboard', 'products'] }),
  })
}

function makeContext(id = 'user-2') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockIsSuperAdmin.mockReturnValue(true)
  mockValidateBody.mockReturnValue({ success: true, data: { permissions: ['dashboard', 'products'] } })

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_TARGET_USER])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
})

describe('PATCH /api/admin/users/[id]/permissions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/users/[id]/permissions — authorization', () => {
  it('returns 403 when caller is not super admin', async () => {
    mockIsSuperAdmin.mockReturnValueOnce(false)
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(403)
  })
})

describe('PATCH /api/admin/users/[id]/permissions — validation', () => {
  it('returns 400 when body validation fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Invalid' }, { status: 400 }),
    })
    const response = await PATCH(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when target user not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when demoting hardcoded super admin', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_TARGET_USER, email: 'andreas@revamp-it.ch' }])
    mockValidateBody.mockReturnValueOnce({ success: true, data: { isSuperAdmin: false } })
    const response = await PATCH(makeRequest({ isSuperAdmin: false }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when attempting self-demotion', async () => {
    mockWhere.mockResolvedValueOnce([{ ...MOCK_TARGET_USER, id: 'admin-1', email: 'admin@revamp-it.ch' }])
    mockValidateBody.mockReturnValueOnce({ success: true, data: { isSuperAdmin: false } })
    const response = await PATCH(makeRequest({ isSuperAdmin: false }), makeContext('admin-1'))
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/users/[id]/permissions — success', () => {
  it('returns 200 when permissions updated', async () => {
    const response = await PATCH(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })
})
