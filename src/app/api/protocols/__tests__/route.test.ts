/**
 * @jest-environment node
 *
 * Tests for GET /api/protocols and POST /api/protocols
 *
 * Mission-relevant: the protocols list is the entry point for the governance
 * module's meeting records. Auth guards and visibility filtering via isSuperAdmin
 * are the core correctness targets.
 *
 * Behaviors locked:
 *   GET /api/protocols
 *   - returns 401 when not authenticated
 *   - returns 200 with protocols list
 *
 *   POST /api/protocols
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 with created protocol
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: (req: Request, session: unknown) => unknown) =>
    (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return handler(req, session)
      }),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: jest.fn().mockReturnValue(false),
}))

jest.mock('@/lib/schemas/protocols', () => ({
  // Static so it survives jest.resetAllMocks()
  createProtocolSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.title) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { title: ['Titel erforderlich'] } }) },
        }
      }
      return {
        success: true,
        data: {
          title: b.title,
          meeting_date: b.meeting_date || '2026-03-01',
          meeting_type: b.meeting_type || 'team',
          visibility: b.visibility || 'staff',
          attendees: b.attendees || [],
          input_method: b.input_method || 'transcript',
        },
      }
    },
  },
}))

const mockGetProtocols = jest.fn()
const mockCreateProtocol = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getProtocols: (...args: unknown[]) => mockGetProtocols.apply(null, args),
  createProtocol: (...args: unknown[]) => mockCreateProtocol.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, errors?: unknown) =>
      NextResponse.json({ success: false, error: msg, ...(errors ? { errors } : {}) }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession(isSuperAdmin = false) {
  return {
    user: {
      id: 'user-1',
      email: 'admin@revamp-it.ch',
      name: 'Admin',
      isStaff: true,
      staffPermissions: ['*'] as string[],
      isSuperAdmin,
    },
    expires: '2027-01-01',
  }
}

const MOCK_PROTOCOLS = [
  { id: 'proto-1', title: 'Teamsitzung März', meeting_type: 'team', status: 'draft' },
  { id: 'proto-2', title: 'Vorstandssitzung', meeting_type: 'board', status: 'review' },
]

const MOCK_CREATED = {
  id: 'proto-new',
  title: 'Neue Sitzung',
  meeting_type: 'team',
  status: 'draft',
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/protocols')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/protocols', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(makeSession())
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockGetProtocols.mockResolvedValue(MOCK_PROTOCOLS)
  mockCreateProtocol.mockResolvedValue(MOCK_CREATED)

  // Re-apply isSuperAdmin default after resetAllMocks
  const permissions = require('@/lib/permissions')
  permissions.isSuperAdmin.mockReturnValue(false)
})

// ============================================================================
// GET /api/protocols
// ============================================================================

describe('GET /api/protocols — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/protocols — authenticated', () => {
  it('returns 200 with protocols list', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns protocols array in response', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].id).toBe('proto-1')
  })

  it('passes isAdmin=false for non-super-admin user', async () => {
    await GET(makeGetRequest())
    expect(mockGetProtocols).toHaveBeenCalledWith(
      'db-user-1',
      false,
      expect.objectContaining({ meeting_type: undefined, status: undefined })
    )
  })

  it('passes isAdmin=true for super admin user', async () => {
    mockAuth.mockResolvedValueOnce(makeSession(true))
    const permissions = require('@/lib/permissions')
    permissions.isSuperAdmin.mockReturnValue(true)
    await GET(makeGetRequest())
    expect(mockGetProtocols).toHaveBeenCalledWith('db-user-1', true, expect.any(Object))
  })

  it('passes meeting_type filter from query params', async () => {
    await GET(makeGetRequest({ meeting_type: 'board' }))
    expect(mockGetProtocols).toHaveBeenCalledWith(
      'db-user-1',
      false,
      expect.objectContaining({ meeting_type: 'board' })
    )
  })

  it('passes status filter from query params', async () => {
    await GET(makeGetRequest({ status: 'review' }))
    expect(mockGetProtocols).toHaveBeenCalledWith(
      'db-user-1',
      false,
      expect.objectContaining({ status: 'review' })
    )
  })
})

// ============================================================================
// POST /api/protocols
// ============================================================================

describe('POST /api/protocols — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ title: 'Test' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/protocols — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makePostRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns error message in body', async () => {
    const response = await POST(makePostRequest({}))
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toBeTruthy()
  })
})

describe('POST /api/protocols — success', () => {
  it('returns 201 with created protocol', async () => {
    const response = await POST(
      makePostRequest({ title: 'Neue Sitzung', meeting_date: '2026-03-01', meeting_type: 'team', visibility: 'staff' })
    )
    expect(response.status).toBe(201)
  })

  it('returns the created protocol in body', async () => {
    const response = await POST(
      makePostRequest({ title: 'Neue Sitzung', meeting_date: '2026-03-01', meeting_type: 'team', visibility: 'staff' })
    )
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('proto-new')
    expect(body.data.title).toBe('Neue Sitzung')
  })

  it('calls createProtocol with dbUserId', async () => {
    await POST(
      makePostRequest({ title: 'Neue Sitzung', meeting_date: '2026-03-01', meeting_type: 'team', visibility: 'staff' })
    )
    expect(mockCreateProtocol).toHaveBeenCalledWith(expect.any(Object), 'db-user-1')
  })
})
