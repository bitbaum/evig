/**
 * @jest-environment node
 *
 * Tests for POST /api/tasks/[id]/request
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 404 when requested user is not found
 *   - returns 201 with task request (specific user)
 *   - returns 201 with task request (broadcast)
 *   - calls notifyUsers for specific user request
 *   - calls notifyAllStaff for broadcast request
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()
jest.mock('@/auth', () => ({ auth: (...args: unknown[]) => mockAuth.apply(null, args) }))

jest.mock('@/lib/api/middleware', () => ({
  withAdmin: (handler: (req: Request, session: unknown, ctx: unknown) => unknown) =>
    (req: Request, context?: { params?: Promise<{ id: string }> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockGetDbUserId = jest.fn()
const mockGetActiveTask = jest.fn()
jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
  getActiveTask: (...args: unknown[]) => mockGetActiveTask.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockTransactionFn = jest.fn()
const mockSelectFn = jest.fn()
jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelectFn.apply(null, args),
    transaction: (...args: unknown[]) => mockTransactionFn.apply(null, args),
  },
}))

jest.mock('@/db/schema/misc', () => ({
  tasks: { id: 't_id', currentStatus: 't_cs' },
  taskRequests: { id: 'tr_id', taskId: 'tr_tid', requestedBy: 'tr_rb', requestedUserId: 'tr_ru', isBroadcast: 'tr_ib', message: 'tr_msg', status: 'tr_s' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}))

jest.mock('@/config/tasks', () => ({
  TASK_STATUSES: { REQUESTED: 'requested' },
  REQUEST_STATUSES: { PENDING: 'pending' },
}))

jest.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
}))

const mockNotifyAllStaff = jest.fn()
const mockNotifyUsers = jest.fn()
jest.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff.apply(null, args),
  notifyUsers: (...args: unknown[]) => mockNotifyUsers.apply(null, args),
}))

jest.mock('@/lib/schemas/tasks', () => ({
  taskRequestSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body) return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      return {
        success: true,
        data: {
          requested_user_id: body.requested_user_id || null,
          message: body.message as string | undefined,
        },
      }
    },
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { POST } from '../route'

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

const MOCK_TASK = { id: 'task-1', title: 'Reinigung', created_by: 'db-user-2', is_archived: false }
const MOCK_REQUEST = { id: 'req-1', taskId: 'task-1', requestedBy: 'db-user-1', requestedUserId: 'target-user-1', status: 'pending' }
const MOCK_BROADCAST_REQUEST = { id: 'req-2', taskId: 'task-1', requestedBy: 'db-user-1', requestedUserId: null, status: 'pending' }

function makeContext(id = 'task-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/tasks/task-1/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let userChain: { from: jest.Mock; where: jest.Mock }

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetActiveTask.mockResolvedValue({ task: MOCK_TASK })
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockNotifyAllStaff.mockResolvedValue(undefined)
  mockNotifyUsers.mockResolvedValue(undefined)

  // User lookup chain: db.select(...).from(users).where(eq(...)) → [{ id }]
  userChain = {
    from: jest.fn(),
    where: jest.fn().mockResolvedValue([{ id: 'target-user-1' }]),
  }
  userChain.from.mockReturnValue(userChain)
  mockSelectFn.mockReturnValue(userChain)

  // Default transaction for specific user request
  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_REQUEST]),
        }),
      }),
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      }),
    }
    return callback(tx)
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/tasks/[id]/request — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ requested_user_id: 'target-user-1' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/tasks/[id]/request — specific user not found', () => {
  it('returns 404 when requested user does not exist', async () => {
    // User lookup returns empty array → user not found
    userChain.where.mockResolvedValueOnce([])
    const response = await POST(makeRequest({ requested_user_id: 'nonexistent-user' }), makeContext())
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body.success).toBe(false)
  })
})

describe('POST /api/tasks/[id]/request — specific user', () => {
  it('returns 201 with task request for specific user', async () => {
    const response = await POST(makeRequest({ requested_user_id: 'target-user-1', message: 'Bitte erledigen' }), makeContext())
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('req-1')
    expect(body.data.requestedUserId).toBe('target-user-1')
  })

  it('calls notifyUsers with the requested user id', async () => {
    await POST(makeRequest({ requested_user_id: 'target-user-1' }), makeContext())
    expect(mockNotifyUsers).toHaveBeenCalledTimes(1)
    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['target-user-1'],
      expect.objectContaining({ type: 'task_request', related_type: 'task', related_id: 'task-1' })
    )
    expect(mockNotifyAllStaff).not.toHaveBeenCalled()
  })
})

describe('POST /api/tasks/[id]/request — broadcast', () => {
  beforeEach(() => {
    // Broadcast: no requested_user_id → transaction returns broadcast record
    mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([MOCK_BROADCAST_REQUEST]),
          }),
        }),
        update: jest.fn().mockReturnValue({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        }),
      }
      return callback(tx)
    })
  })

  it('returns 201 with broadcast task request', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('req-2')
    expect(body.data.requestedUserId).toBeNull()
  })

  it('calls notifyAllStaff for broadcast request', async () => {
    await POST(makeRequest({}), makeContext())
    expect(mockNotifyAllStaff).toHaveBeenCalledTimes(1)
    expect(mockNotifyAllStaff).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'task_request', related_type: 'task', related_id: 'task-1' }),
      'db-user-1'
    )
    expect(mockNotifyUsers).not.toHaveBeenCalled()
  })
})
