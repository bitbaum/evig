/**
 * @jest-environment node
 *
 * Tests for PATCH /api/task-requests/[id]
 *
 * Responds to a task request (accept or decline).
 *
 * Behaviors locked:
 *   PATCH /api/task-requests/[id]
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing status)
 *   - returns 404 when request not found
 *   - returns 400 when request is already answered
 *   - returns 400 when user is the requester (can't answer own request)
 *   - returns 200 on successful accept (direct request)
 *   - returns 200 on successful decline
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
      NextResponse.json({ success: false, error: msg, ...(errors ? { errors } : {}) }, { status: 400 }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/db/schema', () => ({
  taskRequests: {
    id: 'tr_id', taskId: 'tr_tid', requestedBy: 'tr_rb', requestedUserId: 'tr_ru',
    status: 'tr_s', responseMessage: 'tr_rm', updatedAt: 'tr_ua',
  },
  tasks: { id: 't_id', title: 't_title', currentStatus: 't_cs', updatedAt: 't_ua' },
  users: { id: 'u_id' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  ne: jest.fn(),
  sql: Object.assign(jest.fn().mockReturnValue({}), { raw: jest.fn().mockReturnValue({}) }),
}))

jest.mock('@/config/tasks', () => ({
  TASK_STATUSES: { IN_PROGRESS: 'in_progress' },
  REQUEST_STATUSES: { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined' },
}))

jest.mock('@/config/notifications', () => ({
  NOTIFICATION_TYPES: { TASK_REQUEST_RESPONSE: 'task_request_response' },
  RELATED_TYPES: { TASK: 'task' },
}))

const mockCreateNotification = jest.fn()
const mockFireNotification = jest.fn()
jest.mock('@/lib/services/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification.apply(null, args),
  fireNotification: (...args: unknown[]) => mockFireNotification.apply(null, args),
}))

jest.mock('@/lib/schemas/tasks', () => ({
  requestResponseSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.status) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return {
        success: true,
        data: {
          status: body.status,
          response_message: body.response_message as string | undefined,
        },
      }
    },
  },
}))

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    update: jest.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Chain factories
// ---------------------------------------------------------------------------

function makeSelectChain(value: unknown[]) {
  const c: Record<string, jest.Mock> = {}
  ;['from', 'leftJoin'].forEach(m => { c[m] = jest.fn().mockReturnValue(c) })
  c.where = jest.fn().mockResolvedValue(value)
  return c
}

function makeUpdateReturningChain(returnValue: unknown[]) {
  const c: Record<string, jest.Mock> = {}
  c.set = jest.fn().mockReturnValue(c)
  c.where = jest.fn().mockReturnValue(c)
  c.returning = jest.fn().mockResolvedValue(returnValue)
  return c
}

function makeUpdateWhereChain() {
  const c: Record<string, jest.Mock> = {}
  c.set = jest.fn().mockReturnValue(c)
  c.where = jest.fn().mockResolvedValue(undefined)
  return c
}

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { PATCH } from '../route'

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

// Broadcast request (requestedUserId is null), created by user-2
const MOCK_TASK_REQUEST = {
  id: 'req-1',
  taskId: 'task-1',
  taskTitle: 'Reinigung',
  status: 'pending',
  requestedUserId: null,
  requestedBy: 'user-2',
}

const MOCK_UPDATED_REQUEST = {
  id: 'req-1',
  taskId: 'task-1',
  status: 'accepted',
  responseMessage: null,
}

function makeContext(id = 'req-1') {
  return { params: Promise.resolve({ id }) }
}

function makePatchRequest(id = 'req-1', body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/task-requests/${id}`, body !== undefined
    ? { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'PATCH' }
  )
}

// ---------------------------------------------------------------------------
// beforeEach
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockCreateNotification.mockResolvedValue({ id: 'notif-1' })
  mockFireNotification.mockReturnValue(undefined)
})

// ============================================================================
// PATCH /api/task-requests/[id]
// ============================================================================

describe('PATCH /api/task-requests/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/task-requests/[id] — validation', () => {
  it('returns 400 when status is missing', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]))

    const response = await PATCH(makePatchRequest('req-1', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/task-requests/[id] — not found', () => {
  it('returns 404 when request does not exist', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain([]))

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('PATCH /api/task-requests/[id] — already answered', () => {
  it('returns 400 when request is not pending', async () => {
    const mockDb = require('@/db').db
    mockDb.select.mockReturnValueOnce(makeSelectChain([{
      ...MOCK_TASK_REQUEST,
      status: 'accepted',
    }]))

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/task-requests/[id] — own request', () => {
  it('returns 400 when user tries to answer their own request', async () => {
    const mockDb = require('@/db').db
    // requestedBy === session.user.id (user-1)
    mockDb.select.mockReturnValueOnce(makeSelectChain([{
      ...MOCK_TASK_REQUEST,
      requestedBy: 'user-1',
    }]))

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/task-requests/[id] — accept broadcast request', () => {
  it('returns 200 and fires notification', async () => {
    const mockDb = require('@/db').db
    // Select: fetch request
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]))
    // Update 1: update request status (with returning)
    mockDb.update
      .mockReturnValueOnce(makeUpdateReturningChain([MOCK_UPDATED_REQUEST]))
      // Update 2: update task status (where-terminal)
      .mockReturnValueOnce(makeUpdateWhereChain())
      // Update 3: cancel other broadcast requests (where-terminal)
      .mockReturnValueOnce(makeUpdateWhereChain())

    const response = await PATCH(makePatchRequest('req-1', { status: 'accepted' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('req-1')
    expect(mockFireNotification).toHaveBeenCalled()
  })
})

describe('PATCH /api/task-requests/[id] — decline request', () => {
  it('returns 200 on decline', async () => {
    const mockDb = require('@/db').db
    // Select: fetch request
    mockDb.select.mockReturnValueOnce(makeSelectChain([MOCK_TASK_REQUEST]))
    // Update: update request status to declined (with returning)
    mockDb.update.mockReturnValueOnce(
      makeUpdateReturningChain([{ ...MOCK_UPDATED_REQUEST, status: 'declined' }])
    )

    const response = await PATCH(makePatchRequest('req-1', { status: 'declined' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(mockFireNotification).toHaveBeenCalled()
  })
})
