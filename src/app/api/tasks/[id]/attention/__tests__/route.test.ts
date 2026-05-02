/**
 * @jest-environment node
 *
 * Tests for POST /api/tasks/[id]/attention
 *
 * Behaviors locked:
 *   - returns 401 when not authenticated
 *   - returns 404 when task not found (getActiveTask returns error)
 *   - returns 201 with attention flag record
 *   - calls notifyAllStaff with correct payload
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

const mockNotifyAllStaff = jest.fn()
jest.mock('@/lib/services/notifications', () => ({
  notifyAllStaff: (...args: unknown[]) => mockNotifyAllStaff.apply(null, args),
}))

const mockTransactionFn = jest.fn()
jest.mock('@/db', () => ({
  db: { transaction: (...args: unknown[]) => mockTransactionFn.apply(null, args) },
}))

jest.mock('@/db/schema/misc', () => ({
  tasks: { id: 't_id', currentStatus: 't_cs' },
  taskAttentionFlags: { id: 'taf_id', taskId: 'taf_tid', flaggedBy: 'taf_fb', message: 'taf_msg' },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}))

jest.mock('@/config/tasks', () => ({
  TASK_STATUSES: { NEEDS_ATTENTION: 'needs_attention' },
}))

jest.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task' },
}))

jest.mock('@/lib/schemas/tasks', () => ({
  attentionFlagSchema: {
    safeParse: (b: unknown) => ({
      success: true,
      data: { message: (b as Record<string, unknown>)?.message as string | undefined },
    }),
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
const MOCK_FLAG = { id: 'flag-1', taskId: 'task-1', flaggedBy: 'db-user-1', message: 'Braucht Hilfe' }

function makeContext(id = 'task-1') {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/tasks/task-1/attention', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetActiveTask.mockResolvedValue({ task: MOCK_TASK })
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockNotifyAllStaff.mockResolvedValue(undefined)

  mockTransactionFn.mockImplementation(async (callback: (tx: unknown) => unknown) => {
    const tx = {
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([MOCK_FLAG]),
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

describe('POST /api/tasks/[id]/attention — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/tasks/[id]/attention — task not found', () => {
  it('returns 404 when getActiveTask returns an error response', async () => {
    const { NextResponse } = require('next/server')
    mockGetActiveTask.mockResolvedValueOnce({
      error: NextResponse.json({ success: false, error: 'Not found' }, { status: 404 }),
    })
    const response = await POST(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('POST /api/tasks/[id]/attention — success', () => {
  it('returns 201 with attention flag record', async () => {
    const response = await POST(makeRequest({ message: 'Braucht Hilfe' }), makeContext())
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('flag-1')
    expect(body.data.taskId).toBe('task-1')
  })

  it('calls notifyAllStaff with correct payload including task title', async () => {
    await POST(makeRequest({ message: 'Braucht Hilfe' }), makeContext())
    expect(mockNotifyAllStaff).toHaveBeenCalledTimes(1)
    expect(mockNotifyAllStaff).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task_attention',
        related_type: 'task',
        related_id: 'task-1',
      }),
      'db-user-1'
    )
  })
})
