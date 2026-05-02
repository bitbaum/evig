/**
 * @jest-environment node
 *
 * Tests for GET /api/task-requests
 *
 * Returns pending task requests for the current user (direct + broadcasts).
 *
 * Behaviors locked:
 *   GET /api/task-requests
 *   - returns 401 when not authenticated
 *   - returns 200 with requests array
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
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('drizzle-orm/pg-core', () => ({
  alias: (_t: unknown, name: string) => ({
    id: `${name}_id`,
    name: `${name}_name`,
    email: `${name}_email`,
  }),
}))

jest.mock('@/db/schema', () => ({
  taskRequests: {
    id: 'tr_id', taskId: 'tr_tid', requestedBy: 'tr_rb', requestedUserId: 'tr_ru',
    isBroadcast: 'tr_ib', message: 'tr_msg', status: 'tr_s', responseMessage: 'tr_rm',
    completionId: 'tr_ci', createdAt: 'tr_ca', updatedAt: 'tr_ua',
  },
  tasks: {
    id: 't_id', title: 't_title', description: 't_desc', category: 't_cat',
    priority: 't_pri', currentStatus: 't_cs', estimatedMinutes: 't_em',
  },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  ne: jest.fn(),
  isNull: jest.fn(),
  or: jest.fn(),
  desc: jest.fn(),
  sql: Object.assign(jest.fn().mockReturnValue({}), { raw: jest.fn().mockReturnValue({}) }),
}))

jest.mock('@/config/tasks', () => ({
  REQUEST_STATUSES: { PENDING: 'pending' },
}))

// ---------------------------------------------------------------------------
// Drizzle fluent chain mock
// ---------------------------------------------------------------------------

const mockOrderBy = jest.fn()

const q: Record<string, jest.Mock> = {}
;['from', 'leftJoin', 'where', 'groupBy'].forEach(m => {
  q[m] = jest.fn().mockReturnValue(q)
})
q.orderBy = mockOrderBy

jest.mock('@/db', () => ({
  db: { select: jest.fn() },
}))

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

const MOCK_REQUEST = {
  id: 'req-1',
  task_id: 'task-1',
  requested_by: 'user-2',
  status: 'pending',
  task_title: 'Reinigung',
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/task-requests')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Restore chain after resetAllMocks
  Object.keys(q).forEach(k => { q[k] = jest.fn().mockReturnValue(q) })
  q.orderBy = mockOrderBy
  mockOrderBy.mockResolvedValue([MOCK_REQUEST])

  const dbMod = require('@/db')
  dbMod.db.select.mockReturnValue(q)
})

// ============================================================================
// GET /api/task-requests
// ============================================================================

describe('GET /api/task-requests — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/task-requests — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns requests array', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('req-1')
  })

  it('returns empty array when no requests exist', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data).toEqual([])
  })
})
