/**
 * @jest-environment node
 *
 * Tests for POST/DELETE /api/admin/listings/[id]/verify
 *
 * Behaviors locked:
 *   POST /api/admin/listings/[id]/verify
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when listing not found
 *   - returns 200 on success
 *
 *   DELETE /api/admin/listings/[id]/verify
 *   - returns 401 when not authenticated
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
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockValidateBody = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  listings: {
    id: 'l_id', status: 'l_status', verifiedAt: 'l_verifiedAt',
    verifiedBy: 'l_verifiedBy', verificationNotes: 'l_verificationNotes',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  ne: (a: unknown, b: unknown) => ({ __ne: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { REMOVED: 'removed' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody.apply(null, args),
  VerifyListingSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

function makeRequest(method = 'POST', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/listings/lst-1/verify', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'lst-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockFrom.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([{ id: 'lst-1', status: 'active' }])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)

  mockValidateBody.mockReturnValue({ success: true, data: { verification_notes: 'Tested OK' } })
})

// ============================================================================
// POST /api/admin/listings/[id]/verify
// ============================================================================

describe('POST /api/admin/listings/[id]/verify — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest('POST', {}), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/listings/[id]/verify — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const response = await POST(makeRequest('POST', {}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when listing not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await POST(makeRequest('POST', {}), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('POST /api/admin/listings/[id]/verify — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest('POST', {}), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.verified).toBe(true)
    expect(body.data.id).toBe('lst-1')
  })
})

// ============================================================================
// DELETE /api/admin/listings/[id]/verify
// ============================================================================

describe('DELETE /api/admin/listings/[id]/verify — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/listings/[id]/verify — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.verified).toBe(false)
  })
})
