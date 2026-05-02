/**
 * @jest-environment node
 *
 * Tests for GET /api/task-projects/[id], PATCH /api/task-projects/[id],
 * and DELETE /api/task-projects/[id]
 *
 * Behaviors locked:
 *   GET  - 401, 200 with project+tasks, 404 not found
 *   PATCH - 401, 400 validation, 404 not found, 200 updated
 *   DELETE - 401, 404 not found, 200 deleted
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
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? context.params.then((p: { id: string }) => ({ params: p }))
          : Promise.resolve(undefined)
        return resolvedContext.then((ctx: unknown) =>
          (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, ctx)
        )
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
      NextResponse.json({ success: false, error: msg, ...(errors && { errors }) }, { status: 400 }),
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
  tasks: {
    id: 't_id', title: 't_title', description: 't_desc', instructions: 't_ins',
    taskType: 't_type', scheduleCron: 't_cron', scheduleHuman: 't_sh', category: 't_cat',
    tags: 't_tags', priority: 't_pri', estimatedMinutes: 't_em', currentStatus: 't_cs',
    isCompleted: 't_ic', completedAt: 't_ca', completedBy: 't_cb', projectId: 't_pid',
    createdBy: 't_cr', isArchived: 't_ia', createdAt: 't_crat', updatedAt: 't_ua',
  },
  taskCompletions: { id: 'tc_id', taskId: 'tc_tid' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  sql: Object.assign(jest.fn().mockReturnValue({}), { raw: jest.fn().mockReturnValue({}) }),
}))

jest.mock('@/lib/schemas/tasks', () => ({
  updateProjectSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (body && typeof body === 'object' && Object.keys(body).length === 0) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: body || {} }
    },
  },
}))

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Chain factories
// ---------------------------------------------------------------------------

function makeSelectChain(terminalMethod: string, value: unknown[]) {
  const methods = ['from', 'leftJoin', 'where', 'orderBy', 'groupBy', 'limit', 'set']
  const c: Record<string, jest.Mock> = {}
  methods.forEach(m => { c[m] = jest.fn().mockReturnValue(c) })
  c[terminalMethod] = jest.fn().mockResolvedValue(value)
  return c
}

function makeUpdateChain(returnValue: unknown[]) {
  const c: Record<string, jest.Mock> = {}
  c.set = jest.fn().mockReturnValue(c)
  c.where = jest.fn().mockReturnValue(c)
  c.returning = jest.fn().mockResolvedValue(returnValue)
  return c
}

function makeDeleteChain(returnValue: unknown[]) {
  const c: Record<string, jest.Mock> = {}
  c.where = jest.fn().mockReturnValue(c)
  c.returning = jest.fn().mockResolvedValue(returnValue)
  return c
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'

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
  description: null,
  status: 'active',
  target_date: null,
  created_by: 'db-user-1',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  created_by_name: 'Admin',
  created_by_email: 'admin@revamp-it.ch',
}

const MOCK_TASK = {
  id: 'task-1',
  title: 'Reinigung',
  current_status: 'idle',
  project_id: 'proj-1',
}

function makeContext(id = 'proj-1') {
  return { params: Promise.resolve({ id }) }
}

function makeGetRequest(id = 'proj-1') {
  return new NextRequest(`http://localhost/api/task-projects/${id}`)
}

function makePatchRequest(id = 'proj-1', body?: Record<string, unknown>) {
  const opts: RequestInit = { method: 'PATCH' }
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return new NextRequest(`http://localhost/api/task-projects/${id}`, opts)
}

function makeDeleteRequest(id = 'proj-1') {
  return new NextRequest(`http://localhost/api/task-projects/${id}`, { method: 'DELETE' })
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
})

// ============================================================================
// GET /api/task-projects/[id]
// ============================================================================

describe('GET /api/task-projects/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/task-projects/[id] — authenticated', () => {
  it('returns 200 with project and tasks', async () => {
    const mockDb = require('@/db').db
    mockDb.select
      .mockReturnValueOnce(makeSelectChain('where', [MOCK_PROJECT]))
      .mockReturnValueOnce(makeSelectChain('orderBy', [MOCK_TASK]))

    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.project.id).toBe('proj-1')
    expect(Array.isArray(body.data.tasks)).toBe(true)
    expect(body.data.tasks).toHaveLength(1)
  })

  it('returns 404 when project not found', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain('where', []))

    const response = await GET(makeGetRequest('nonexistent'), makeContext('nonexistent'))
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// PATCH /api/task-projects/[id]
// ============================================================================

describe('PATCH /api/task-projects/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest('proj-1', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/task-projects/[id] — validation', () => {
  it('returns 400 when body is empty object', async () => {
    const response = await PATCH(makePatchRequest('proj-1', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/task-projects/[id] — not found', () => {
  it('returns 404 when project does not exist', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain('where', []))

    const response = await PATCH(makePatchRequest('proj-1', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/task-projects/[id] — success', () => {
  it('returns 200 with updated project', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain('where', [{ id: 'proj-1' }]))
    mockDb.update.mockReturnValue(makeUpdateChain([{ ...MOCK_PROJECT, title: 'Updated' }]))

    const response = await PATCH(makePatchRequest('proj-1', { title: 'Updated' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('proj-1')
  })
})

// ============================================================================
// DELETE /api/task-projects/[id]
// ============================================================================

describe('DELETE /api/task-projects/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/task-projects/[id] — not found', () => {
  it('returns 404 when project does not exist', async () => {
    const mockDb = require('@/db').db
    mockDb.delete.mockReturnValue(makeDeleteChain([]))

    const response = await DELETE(makeDeleteRequest('nonexistent'), makeContext('nonexistent'))
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/task-projects/[id] — success', () => {
  it('returns 200 when project deleted', async () => {
    const mockDb = require('@/db').db
    mockDb.delete.mockReturnValue(makeDeleteChain([{ id: 'proj-1' }]))

    const response = await DELETE(makeDeleteRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.deleted).toBe(true)
  })
})
