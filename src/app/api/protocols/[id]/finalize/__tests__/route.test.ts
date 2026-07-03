/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/finalize
 *
 * Mission-relevant: finalizing a protocol publishes it to all staff and triggers
 * a notification. Auth guard, not-found guard (protocol must be in "review"
 * status), and notification dispatch are the core correctness targets.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/finalize
 *   - returns 401 when not authenticated
 *   - returns 404 when finalizeProtocol returns false (not found / wrong status)
 *   - returns 200 with { finalized: true } on success
 *   - route does NOT notify (service owns the attendee notification)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockFinalizeProtocol = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  finalizeProtocol: (...args: unknown[]) => mockFinalizeProtocol.apply(null, args),
}))

const mockNotifyAllStaff = jest.fn()

jest.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff.apply(null, args),
}))

jest.mock('@/config/notifications', () => ({
  RELATED_TYPES: { PROTOCOL: 'protocol' },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (resource: string) =>
      NextResponse.json({ success: false, error: `${resource} nicht gefunden` }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSession() {
  return {
    user: {
      id: 'user-1',
      email: 'admin@revamp-it.ch',
      name: 'Admin',
      isStaff: true,
      staffPermissions: ['*'] as string[],
      isSuperAdmin: true,
    },
    expires: '2027-01-01',
  }
}

function makeRequest(id = 'proto-1') {
  return new NextRequest(`http://localhost/api/protocols/${id}/finalize`, {
    method: 'POST',
  })
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(makeSession())
  mockFinalizeProtocol.mockResolvedValue(true)
  mockNotifyAllStaff.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/protocols/[id]/finalize
// ============================================================================

describe('POST /api/protocols/[id]/finalize — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/protocols/[id]/finalize — not found', () => {
  it('returns 404 when finalizeProtocol returns false', async () => {
    mockFinalizeProtocol.mockResolvedValueOnce(false)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns error message referencing review status', async () => {
    mockFinalizeProtocol.mockResolvedValueOnce(false)
    const response = await POST(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(body.error).toContain('Protokoll')
  })
})

describe('POST /api/protocols/[id]/finalize — success', () => {
  it('returns 200 with finalized: true', async () => {
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ finalized: true })
  })

  it('calls finalizeProtocol with the protocol id from params', async () => {
    await POST(makeRequest('proto-42'), makeContext('proto-42'))
    expect(mockFinalizeProtocol).toHaveBeenCalledWith('proto-42')
  })

  it('does NOT notify from the route — the attendee notification fires inside finalizeProtocol (a route-level notifyAllStaff double-notified every staff member)', async () => {
    await POST(makeRequest(), makeContext())
    expect(mockNotifyAllStaff).not.toHaveBeenCalled()
  })

  it('does not call notifyAllStaff when finalizeProtocol returns false', async () => {
    mockFinalizeProtocol.mockResolvedValueOnce(false)
    await POST(makeRequest(), makeContext())
    expect(mockNotifyAllStaff).not.toHaveBeenCalled()
  })
})
