/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/decisions/create-tasks
 *
 * This route creates tasks from AI-generated proposals for an approved decision.
 * Wrong error mapping prevents admins from understanding why task creation fails,
 * stalling governance workflows for the non-profit.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/decisions/create-tasks
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 400 when createProposedTasks throws TASKS_ALREADY_CREATED
 *   - returns 400 when createProposedTasks throws DECISION_NOT_APPROVED
 *   - returns 201 with task result on success
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
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return handler(req, session, resolvedContext)
      }),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// Schema mock — static, survives jest.resetAllMocks()
jest.mock('@/lib/schemas/protocols', () => ({
  closeDecisionSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.action_item_id) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { action_item_id: body.action_item_id } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    TASKS_ALREADY_CREATED: 'Aufgaben bereits erstellt',
    DECISION_NOT_APPROVED: 'Nicht genehmigt',
  },
}))

const mockCreateProposedTasks = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  createProposedTasks: (...args: unknown[]) => mockCreateProposedTasks.apply(null, args),
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

const MOCK_TASK_RESULT = {
  taskIds: ['task-1', 'task-2'],
  count: 2,
}

function makeRequest(body?: Record<string, unknown>) {
  const opts: RequestInit = { method: 'POST' }
  if (body !== undefined) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/protocols/proto-1/decisions/create-tasks', opts)
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockCreateProposedTasks.mockResolvedValue(MOCK_TASK_RESULT)
})

// ============================================================================
// POST — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/decisions/create-tasks — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/protocols/[id]/decisions/create-tasks — validation', () => {
  it('returns 400 when body is missing action_item_id', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call createProposedTasks when validation fails', async () => {
    await POST(makeRequest({}), makeContext())
    expect(mockCreateProposedTasks).not.toHaveBeenCalled()
  })
})

// ============================================================================
// POST — service errors
// ============================================================================

describe('POST /api/protocols/[id]/decisions/create-tasks — service errors', () => {
  it('returns 400 when createProposedTasks throws TASKS_ALREADY_CREATED', async () => {
    mockCreateProposedTasks.mockRejectedValueOnce(new Error('TASKS_ALREADY_CREATED'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Aufgaben bereits erstellt')
  })

  it('returns 400 when createProposedTasks throws DECISION_NOT_APPROVED', async () => {
    mockCreateProposedTasks.mockRejectedValueOnce(new Error('DECISION_NOT_APPROVED'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Nicht genehmigt')
  })

  it('returns 500 when createProposedTasks throws an unexpected error', async () => {
    mockCreateProposedTasks.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/protocols/[id]/decisions/create-tasks — success', () => {
  it('returns 201 with task result', async () => {
    const response = await POST(makeRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_TASK_RESULT)
  })

  it('passes protocolId, action_item_id, and dbUserId to createProposedTasks', async () => {
    await POST(makeRequest({ action_item_id: 'item-42' }), makeContext('proto-99'))
    expect(mockCreateProposedTasks).toHaveBeenCalledWith('proto-99', 'item-42', 'db-user-1')
  })
})
