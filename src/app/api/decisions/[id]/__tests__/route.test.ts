/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/decisions/[id]
 *
 * Mission-relevant: decisions are irreversible governance records. GET is
 * member-accessible; PATCH/DELETE are staff-only. The isSuperAdmin check
 * on DELETE gates irreversible deletion — wrong behavior here loses data.
 *
 * Behaviors locked:
 *   GET /api/decisions/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when decision not found
 *   - returns 200 with decision
 *
 *   PATCH /api/decisions/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 on invalid body
 *   - returns 404 when not found
 *   - returns 400 on not_editable / not_creator
 *   - returns 200 with updated decision
 *
 *   DELETE /api/decisions/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when not found
 *   - returns 400 when user lacks delete permission
 *   - returns 200 with deleted: true
 *   - returns 500 when service throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: (req: Request, session: unknown, context: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: unknown }).user) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return handler(req, session, resolvedContext)
      }),
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

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockGetDecisionById = jest.fn()
const mockUpdateDecision = jest.fn()
const mockDeleteDecision = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getDecisionById: (...args: unknown[]) => mockGetDecisionById.apply(null, args),
  updateDecision: (...args: unknown[]) => mockUpdateDecision.apply(null, args),
  deleteDecision: (...args: unknown[]) => mockDeleteDecision.apply(null, args),
}))

jest.mock('@/lib/schemas/decisions', () => ({
  updateDecisionSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.title) return { success: false, error: { issues: [{ message: 'Titel erforderlich' }] } }
      return { success: true, data: { title: b.title, description: b.description } }
    },
  },
}))

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: jest.fn().mockReturnValue(false),
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALL_FIELDS_REQUIRED: 'All fields required',
    DECISION_NOT_EDITABLE: 'Entscheidung nicht bearbeitbar',
    DECISION_UPDATE_FAILED: 'Update fehlgeschlagen',
  },
  SUCCESS_MESSAGES: {},
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

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

const MOCK_DECISION = { id: 'dec-1', title: 'Neue Entscheidung', status: 'discussion', description: 'test' }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  const opts: RequestInit = { method }
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/decisions/dec-1', opts)
}

function makeContext(id = 'dec-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-admin-1' })
  mockGetDecisionById.mockResolvedValue(MOCK_DECISION)
  mockUpdateDecision.mockResolvedValue({ decision: MOCK_DECISION })
  mockDeleteDecision.mockResolvedValue({ deleted: true })

  // Re-setup isSuperAdmin mock after resetAllMocks
  const perms = require('@/lib/permissions')
  perms.isSuperAdmin.mockReturnValue(false)
})

// ============================================================================
// GET /api/decisions/[id]
// ============================================================================

describe('GET /api/decisions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/decisions/[id] — authenticated', () => {
  it('returns 200 with decision', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the decision data', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.title).toBe('Neue Entscheidung')
  })

  it('returns 404 when decision not found', async () => {
    mockGetDecisionById.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// PATCH /api/decisions/[id]
// ============================================================================

describe('PATCH /api/decisions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'New' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/decisions/[id] — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/decisions/[id] — service errors', () => {
  it('returns 404 when decision not found', async () => {
    mockUpdateDecision.mockResolvedValueOnce({ error: 'not_found' })
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when not editable', async () => {
    mockUpdateDecision.mockResolvedValueOnce({ error: 'not_editable' })
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when not creator', async () => {
    mockUpdateDecision.mockResolvedValueOnce({ error: 'not_creator' })
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/decisions/[id] — success', () => {
  it('returns 200 with updated decision', async () => {
    const response = await PATCH(makeRequest('PATCH', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/decisions/[id]
// ============================================================================

describe('DELETE /api/decisions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/decisions/[id] — service errors', () => {
  it('returns 404 when decision not found', async () => {
    mockDeleteDecision.mockResolvedValueOnce({ error: 'not_found' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when user lacks permission', async () => {
    mockDeleteDecision.mockResolvedValueOnce({ error: 'not_creator' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/decisions/[id] — success', () => {
  it('returns 200 with deleted: true', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.deleted).toBe(true)
  })

  it('returns 500 when service throws', async () => {
    mockDeleteDecision.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})
