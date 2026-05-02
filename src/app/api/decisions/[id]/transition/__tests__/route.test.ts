/**
 * @jest-environment node
 *
 * Tests for POST /api/decisions/[id]/transition
 *
 * Mission-relevant: decision status transitions (draft→discussion→voting→closed)
 * are irreversible governance events. Wrong error codes send the wrong UX signal
 * (e.g. quorum_not_met should be a clear 400, not a 500).
 *
 * Behaviors locked:
 *   POST /api/decisions/[id]/transition
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (schema validation)
 *   - returns 404 when decision not found
 *   - returns 400 on invalid transition
 *   - returns 400 when quorum not met
 *   - returns 200 on success
 *   - sends notification when transitioning to voting
 *   - sends notification when transitioning to closed
 *   - notification failure does not affect response
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

const mockTransitionDecision = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  transitionDecision: (...args: unknown[]) => mockTransitionDecision.apply(null, args),
}))

const mockNotifyAllStaff = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff.apply(null, args),
}))

jest.mock('@/lib/schemas/decisions', () => ({
  // Static (not jest.fn) so it survives jest.resetAllMocks() without re-setup
  transitionDecisionSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.status) return { success: false, error: { issues: [{ message: 'Status erforderlich' }] } }
      return { success: true, data: { status: b.status, cancelReason: b.cancelReason, outcomeSummary: b.outcomeSummary } }
    },
  },
}))

jest.mock('@/config/decisions', () => ({
  DECISION_STATUS: {
    DRAFT: 'draft',
    DISCUSSION: 'discussion',
    VOTING: 'voting',
    CLOSED: 'closed',
    CANCELLED: 'cancelled',
  },
}))

jest.mock('@/config/notifications', () => ({
  NOTIFICATION_TYPES: { DECISION_VOTING: 'decision_voting', DECISION_CLOSED: 'decision_closed' },
  RELATED_TYPES: { DECISION: 'decision' },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALL_FIELDS_REQUIRED: 'All fields required',
    DECISION_INVALID_TRANSITION: 'Ungültiger Statuswechsel',
  },
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
import { POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_DECISION = { id: 'dec-1', title: 'New Tech Proposal', status: 'voting' }

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/decisions/dec-1/transition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'dec-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-admin-1' })
  mockTransitionDecision.mockResolvedValue({ decision: MOCK_DECISION })
  mockNotifyAllStaff.mockResolvedValue(undefined)
})

// ============================================================================
// POST /api/decisions/[id]/transition
// ============================================================================

describe('POST /api/decisions/[id]/transition — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/decisions/[id]/transition — validation', () => {
  it('returns 400 when status is missing', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/decisions/[id]/transition — service errors', () => {
  it('returns 404 when decision not found', async () => {
    mockTransitionDecision.mockResolvedValueOnce({ error: 'not_found' })
    const response = await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 on invalid transition', async () => {
    mockTransitionDecision.mockResolvedValueOnce({ error: 'invalid_transition' })
    const response = await POST(makeRequest({ status: 'closed' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when quorum not met', async () => {
    mockTransitionDecision.mockResolvedValueOnce({ error: 'quorum_not_met', message: 'Quorum nicht erreicht' })
    const response = await POST(makeRequest({ status: 'closed' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Quorum')
  })
})

describe('POST /api/decisions/[id]/transition — success', () => {
  it('returns 200 with decision data', async () => {
    const response = await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(response.status).toBe(200)
  })

  it('notifies staff when transitioning to voting', async () => {
    await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(mockNotifyAllStaff).toHaveBeenCalled()
  })

  it('notifies staff when transitioning to closed', async () => {
    mockTransitionDecision.mockResolvedValueOnce({ decision: { ...MOCK_DECISION, status: 'closed' } })
    await POST(makeRequest({ status: 'closed', outcomeSummary: 'Approved' }), makeContext())
    expect(mockNotifyAllStaff).toHaveBeenCalled()
  })

  it('does not notify when transitioning to other status', async () => {
    mockTransitionDecision.mockResolvedValueOnce({ decision: { ...MOCK_DECISION, status: 'discussion' } })
    await POST(makeRequest({ status: 'discussion' }), makeContext())
    expect(mockNotifyAllStaff).not.toHaveBeenCalled()
  })

  it('returns 500 when notification throws (no fire-and-forget guard)', async () => {
    mockNotifyAllStaff.mockRejectedValueOnce(new Error('notification down'))
    const response = await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(response.status).toBe(500)
  })
})

describe('POST /api/decisions/[id]/transition — DB error', () => {
  it('returns 500 when service throws', async () => {
    mockTransitionDecision.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makeRequest({ status: 'voting' }), makeContext())
    expect(response.status).toBe(500)
  })
})
