/**
 * @jest-environment node
 *
 * Tests for PUT /api/admin/team/profiles/[id]/focus
 *
 * Behaviors locked:
 *   PUT /api/admin/team/profiles/[id]/focus
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 404 when profile not found
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
const mockValidateCurrentFocus = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
  },
}))

jest.mock('@/db/schema', () => ({
  teamProfiles: {
    id: 'tp_id', userId: 'tp_userId', currentFocus: 'tp_currentFocus',
    currentFocusUpdatedAt: 'tp_currentFocusUpdatedAt', updatedAt: 'tp_updatedAt',
  },
  users: { id: 'u_id', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/lib/schemas/activity', () => ({
  validateCurrentFocus: (...args: unknown[]) => mockValidateCurrentFocus.apply(null, args),
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
import { PUT } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/team/profiles/prof-1/focus', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'prof-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockValidateCurrentFocus.mockReturnValue({ success: true, data: { current_focus: 'Working on auth refactor' } })

  mockFrom.mockReturnValue({ innerJoin: mockInnerJoin })
  mockInnerJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockResolvedValue([{ id: 'prof-1', userId: 'u-1', userEmail: 'hans@example.com' }])

  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue(undefined)
})

// ============================================================================
// PUT /api/admin/team/profiles/[id]/focus
// ============================================================================

describe('PUT /api/admin/team/profiles/[id]/focus — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PUT(makeRequest({ current_focus: 'Working on auth' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/admin/team/profiles/[id]/focus — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateCurrentFocus.mockReturnValueOnce({
      success: false,
      error: { flatten: () => ({ fieldErrors: {} }) },
    })
    const response = await PUT(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 404 when profile not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PUT(makeRequest({ current_focus: 'Working on auth' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/admin/team/profiles/[id]/focus — success', () => {
  it('returns 200 on success', async () => {
    const response = await PUT(makeRequest({ current_focus: 'Working on auth refactor' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.current_focus).toBe('Working on auth refactor')
    expect(mockUpdateWhere).toHaveBeenCalledTimes(1)
  })
})
