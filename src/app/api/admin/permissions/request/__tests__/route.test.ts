/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/permissions/request
 *
 * Behaviors locked:
 *   POST /api/admin/permissions/request
 *   - returns 401 when not authenticated
 *   - returns 400 when sections is empty or not an array
 *   - returns 400 when sections contain invalid values
 *   - returns 400 when reason is too short
 *   - returns 400 when a pending request already exists for those sections
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
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  staffPermissionRequests: {
    id: 'spr_id', userId: 'spr_userId', requestedSections: 'spr_sections',
    reason: 'spr_reason', status: 'spr_status',
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

jest.mock('@/config/permission-request-status', () => ({
  PERMISSION_REQUEST_STATUS: { PENDING: 'pending' },
}))

jest.mock('@/lib/permissions', () => ({
  ADMIN_SECTIONS: { dashboard: {}, products: {}, users: {} },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'staff@revamp-it.ch', name: 'Staff', isStaff: true, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/permissions/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([])  // no existing pending request

  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([{ id: 'new-req-1' }])
})

// ============================================================================
// POST /api/admin/permissions/request
// ============================================================================

describe('POST /api/admin/permissions/request — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ sections: ['products'], reason: 'I need access to manage products.' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/permissions/request — validation', () => {
  it('returns 400 when sections is empty', async () => {
    const response = await POST(makeRequest({ sections: [], reason: 'I need access to manage products.' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when sections is not an array', async () => {
    const response = await POST(makeRequest({ sections: 'products', reason: 'I need access.' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when sections contain invalid values', async () => {
    const response = await POST(makeRequest({ sections: ['invalid_section'], reason: 'I need access to manage products.' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when reason is too short', async () => {
    const response = await POST(makeRequest({ sections: ['products'], reason: 'Short' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when a pending request already exists', async () => {
    mockWhere.mockResolvedValueOnce([{ id: 'existing-req' }])
    const response = await POST(makeRequest({ sections: ['products'], reason: 'I need access to manage products.' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/admin/permissions/request — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest({ sections: ['products'], reason: 'I need access to manage products in the store.' }))
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.requestId).toBe('new-req-1')
  })
})
