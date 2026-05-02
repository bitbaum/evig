/**
 * @jest-environment node
 *
 * Tests for GET /api/task-analytics
 *
 * Runs 8 parallel queries via Promise.all to generate task statistics.
 *
 * Behaviors locked:
 *   GET /api/task-analytics
 *   - returns 401 when not authenticated
 *   - returns 200 with analytics overview (parsed integers, not strings)
 *   - uses default timeframe of 30 days
 *   - accepts custom days param
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
    return (req: Request, context?: unknown) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, context)
      })
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/db/schema', () => ({
  tasks: {
    id: 't_id', isArchived: 't_ia', currentStatus: 't_cs', isCompleted: 't_ic',
    category: 't_cat', isStaff: 't_staff',
  },
  taskCompletions: {
    id: 'tc_id', taskId: 'tc_tid', completedBy: 'tc_cb', completedAt: 'tc_ca',
    durationMinutes: 'tc_dm',
  },
  taskRequests: { id: 'tr_id', status: 'tr_s' },
  taskAttentionFlags: { id: 'taf_id', isResolved: 'taf_res' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email', isStaff: 'u_staff' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: Object.assign(jest.fn().mockReturnValue({}), { raw: jest.fn().mockReturnValue({}) }),
}))

jest.mock('@/config/tasks', () => ({
  TASK_STATUSES: {
    NEEDS_ATTENTION: 'needs_attention',
    REQUESTED: 'requested',
    IN_PROGRESS: 'in_progress',
  },
  REQUEST_STATUSES: { PENDING: 'pending' },
}))

jest.mock('@/db', () => ({
  db: { select: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Chain factory
// ---------------------------------------------------------------------------

function makeChain(terminalMethod: string, value: unknown) {
  const methods = ['from', 'leftJoin', 'where', 'groupBy', 'having', 'orderBy']
  const c: Record<string, jest.Mock> = {}
  methods.forEach(m => { c[m] = jest.fn().mockReturnValue(c) })
  c[terminalMethod] = jest.fn().mockResolvedValue(value)
  return c
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
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

const MOCK_STATS = {
  total_active: '10',
  needs_attention: '2',
  requested: '1',
  in_progress: '3',
  completed_one_time: '4',
}

const MOCK_COMPLETIONS = {
  total_completions: '25',
  unique_completers: '5',
  avg_duration: '30',
}

const MOCK_TODAY = { completed_today: '3' }
const MOCK_WEEK = { completed_this_week: '15' }
const MOCK_PENDING = { pending_requests: '2' }
const MOCK_FLAGS = { active_flags: '1' }

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/task-analytics')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  const mockDb = require('@/db').db
  mockDb.select
    .mockReturnValueOnce(makeChain('from', [MOCK_STATS]))           // 1. overall stats
    .mockReturnValueOnce(makeChain('where', [MOCK_COMPLETIONS]))    // 2. completions timeframe
    .mockReturnValueOnce(makeChain('where', [MOCK_TODAY]))          // 3. today
    .mockReturnValueOnce(makeChain('where', [MOCK_WEEK]))           // 4. this week
    .mockReturnValueOnce(makeChain('orderBy', []))                  // 5. by category
    .mockReturnValueOnce(makeChain('orderBy', []))                  // 6. contributions
    .mockReturnValueOnce(makeChain('where', [MOCK_PENDING]))        // 7. pending requests
    .mockReturnValueOnce(makeChain('where', [MOCK_FLAGS]))          // 8. active flags
})

// ============================================================================
// GET /api/task-analytics
// ============================================================================

describe('GET /api/task-analytics — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/task-analytics — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns analytics overview with parsed integers', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.overview.total_active).toBe(10)
    expect(body.data.overview.needs_attention).toBe(2)
    expect(body.data.overview.requested).toBe(1)
    expect(body.data.overview.in_progress).toBe(3)
    expect(body.data.overview.completed_one_time).toBe(4)
    expect(body.data.overview.total_completions).toBe(25)
    expect(body.data.overview.unique_completers).toBe(5)
    expect(body.data.overview.completed_today).toBe(3)
    expect(body.data.overview.completed_this_week).toBe(15)
    expect(body.data.overview.pending_requests).toBe(2)
    expect(body.data.overview.active_attention_flags).toBe(1)
  })

  it('defaults to 30 day timeframe', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data.timeframe_days).toBe(30)
  })

  it('returns by_category and contributions arrays', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(Array.isArray(body.data.by_category)).toBe(true)
    expect(Array.isArray(body.data.contributions)).toBe(true)
  })
})

describe('GET /api/task-analytics — custom days param', () => {
  it('uses custom days when provided', async () => {
    // Re-queue all 8 chains for the new call
    const mockDb = require('@/db').db
    mockDb.select
      .mockReturnValueOnce(makeChain('from', [MOCK_STATS]))
      .mockReturnValueOnce(makeChain('where', [MOCK_COMPLETIONS]))
      .mockReturnValueOnce(makeChain('where', [MOCK_TODAY]))
      .mockReturnValueOnce(makeChain('where', [MOCK_WEEK]))
      .mockReturnValueOnce(makeChain('orderBy', []))
      .mockReturnValueOnce(makeChain('orderBy', []))
      .mockReturnValueOnce(makeChain('where', [MOCK_PENDING]))
      .mockReturnValueOnce(makeChain('where', [MOCK_FLAGS]))

    const response = await GET(makeGetRequest({ days: '7' }))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.timeframe_days).toBe(7)
  })
})
