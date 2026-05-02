/**
 * @jest-environment node
 *
 * Tests for POST /api/admin/hirn/actions/execute
 *
 * Behaviors locked:
 *   POST /api/admin/hirn/actions/execute
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid
 *   - returns 403 when user lacks section access
 *   - returns error when getDbUserId fails
 *   - returns 200 on success
 *   - returns 500 when executeHirnAction throws
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
    return (req: Request) =>
      mockAuth().then((session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        return (handler as (r: Request, s: unknown) => unknown)(req, session)
      })
  },
}))

const mockValidateExecuteActionInput = jest.fn()
const mockExecuteHirnAction = jest.fn()

jest.mock('@/lib/hirn/action-executor', () => ({
  executeHirnAction: (...args: unknown[]) => mockExecuteHirnAction.apply(null, args),
}))

jest.mock('@/lib/hirn/action-executor-contracts', () => ({
  validateExecuteActionInput: (...args: unknown[]) => mockValidateExecuteActionInput.apply(null, args),
}))

const mockCanAccessSection = jest.fn()

jest.mock('@/lib/permissions', () => ({
  canAccessSection: (...args: unknown[]) => mockCanAccessSection.apply(null, args),
  isSuperAdmin: jest.fn().mockReturnValue(false),
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiForbidden: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 403 }),
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
  user: {
    id: 'admin-1',
    email: 'admin@revamp-it.ch',
    name: 'Admin',
    isStaff: true,
    staffPermissions: ['*'] as string[],
    isSuperAdmin: true,
  },
  expires: '2027-01-01',
}

const VALID_ACTION_BODY = {
  actionType: 'create_task' as const,
  payload: { title: 'Test Task', description: 'Test' },
}

function makeRequest(body: Record<string, unknown> = VALID_ACTION_BODY) {
  return new NextRequest('http://localhost/api/admin/hirn/actions/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockValidateExecuteActionInput.mockReturnValue({ success: true, data: VALID_ACTION_BODY })
  mockCanAccessSection.mockReturnValue(true)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockExecuteHirnAction.mockResolvedValue({ taskId: 'task-123', created: true })
})

// ============================================================================
// POST /api/admin/hirn/actions/execute
// ============================================================================

describe('POST /api/admin/hirn/actions/execute — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/hirn/actions/execute — validation', () => {
  it('returns 400 when body is invalid', async () => {
    mockValidateExecuteActionInput.mockReturnValueOnce({
      success: false,
      error: { issues: [{ message: 'actionType is required' }] },
    })
    const response = await POST(makeRequest({}))
    expect(response.status).toBe(400)
  })

  it('returns 403 when user lacks section access', async () => {
    mockCanAccessSection.mockReturnValueOnce(false)
    const response = await POST(makeRequest())
    expect(response.status).toBe(403)
  })
})

describe('POST /api/admin/hirn/actions/execute — success', () => {
  it('returns 200 on success', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.taskId).toBe('task-123')
  })

  it('returns error response when getDbUserId fails', async () => {
    const { NextResponse } = jest.requireActual('next/server')
    const errorResponse = NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    mockGetDbUserId.mockResolvedValueOnce({ error: errorResponse })
    const response = await POST(makeRequest())
    expect(response.status).toBe(404)
  })

  it('returns 500 when executeHirnAction throws', async () => {
    mockExecuteHirnAction.mockRejectedValueOnce(new Error('Action failed'))
    const response = await POST(makeRequest())
    expect(response.status).toBe(500)
  })
})
