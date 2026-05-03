/**
 * @jest-environment node
 *
 * Tests for GET /api/task-projects and POST /api/task-projects
 *
 * Behaviors locked:
 *   GET /api/task-projects
 *   - returns 401 when not authenticated
 *   - returns 200 with projects array
 *
 *   POST /api/task-projects
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 201 with created project
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
    apiBadRequest: (msg: string, errors?: unknown) =>
      NextResponse.json({ success: false, error: msg, ...(errors ? { errors } : {}) }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/db/schema', () => ({
  taskProjects: {
    id: 'tp_id', title: 'tp_title', description: 'tp_desc', status: 'tp_status',
    targetDate: 'tp_td', createdBy: 'tp_cb', createdAt: 'tp_ca', updatedAt: 'tp_ua',
  },
  tasks: { id: 't_id', projectId: 't_pid', isArchived: 't_ia', isCompleted: 't_ic' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  sql: Object.assign(jest.fn().mockReturnValue({}), { raw: jest.fn().mockReturnValue({}) }),
  not: jest.fn(),
}))

jest.mock('@/lib/schemas/tasks', () => ({
  createProjectSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.title || !body?.status) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return {
        success: true,
        data: {
          title: body.title,
          status: body.status,
          description: undefined,
          target_date: undefined,
        },
      }
    },
  },
}))

// ---------------------------------------------------------------------------
// Drizzle fluent chain mock
// ---------------------------------------------------------------------------

const mockOrderByTerminal = jest.fn()
const mockWhereTerminal = jest.fn()
const mockReturning = jest.fn()
const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })

const q: Record<string, jest.Mock> = {}
;['from', 'leftJoin', 'where', 'groupBy', 'having', 'limit', 'offset'].forEach(m => {
  q[m] = jest.fn().mockReturnValue(q)
})
q.orderBy = mockOrderByTerminal

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

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

const MOCK_PROJECT = {
  id: 'proj-1',
  title: 'Q1 Cleanup',
  status: 'active',
  createdBy: 'db-user-1',
}

function makeGetRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/task-projects')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

function makePostRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/task-projects', body
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'POST' }
  )
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // Restore chain methods after resetAllMocks
  Object.keys(q).forEach(k => { q[k] = jest.fn().mockReturnValue(q) })
  q.orderBy = mockOrderByTerminal
  mockOrderByTerminal.mockResolvedValue([MOCK_PROJECT])

  // For POST user lookup — where is terminal for select
  mockWhereTerminal.mockResolvedValue([{ id: 'db-user-1' }])

  // Insert chain
  mockValues.mockReturnValue({ returning: mockReturning })
  mockReturning.mockResolvedValue([MOCK_PROJECT])

  const dbMod = require('@/db')
  dbMod.db.select.mockReturnValue(q)
  dbMod.db.insert.mockReturnValue({ values: mockValues })
})

// ============================================================================
// GET /api/task-projects
// ============================================================================

describe('GET /api/task-projects — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/task-projects — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns projects array', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('proj-1')
  })

  it('returns empty array when no projects exist', async () => {
    mockOrderByTerminal.mockResolvedValueOnce([])
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data).toEqual([])
  })
})

// ============================================================================
// POST /api/task-projects
// ============================================================================

describe('POST /api/task-projects — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ title: 'Test', status: 'planning' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/task-projects — validation', () => {
  it('returns 400 when title is missing', async () => {
    const response = await POST(makePostRequest({ status: 'planning' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when status is missing', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup' }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/task-projects — success', () => {
  beforeEach(() => {
    // For POST: first select call uses where as terminal (user lookup)
    const dbMod = require('@/db')
    const userLookupChain: Record<string, jest.Mock> = {}
    ;['from', 'leftJoin', 'groupBy'].forEach(m => { userLookupChain[m] = jest.fn().mockReturnValue(userLookupChain) })
    userLookupChain.where = jest.fn().mockResolvedValue([{ id: 'db-user-1' }])
    dbMod.db.select.mockReturnValue(userLookupChain)
  })

  it('returns 201 with created project', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup', status: 'active' }))
    expect(response.status).toBe(201)
  })

  it('returns project data', async () => {
    const response = await POST(makePostRequest({ title: 'Q1 Cleanup', status: 'active' }))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('proj-1')
    expect(body.data.title).toBe('Q1 Cleanup')
  })
})
