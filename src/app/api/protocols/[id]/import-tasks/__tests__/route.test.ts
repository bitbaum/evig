/**
 * @jest-environment node
 *
 * Tests for POST /api/protocols/[id]/import-tasks
 *
 * This route imports a task list (JSON or plain text) into a protocol.
 * Only draft/review protocols can be edited; importing into a finalized
 * protocol would corrupt the non-profit's governance record.
 *
 * Behaviors locked:
 *   POST /api/protocols/[id]/import-tasks
 *   - returns 401 when not authenticated
 *   - returns 400 when content is too short
 *   - returns 404 when protocol is not found
 *   - returns 400 when protocol status is not draft or review
 *   - returns 200 with import result on success
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

const mockIsSuperAdmin = jest.fn()

jest.mock('@/lib/permissions', () => ({
  isSuperAdmin: (...args: unknown[]) => mockIsSuperAdmin.apply(null, args),
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
  importTasksSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.content || (body.content as string).length < 10) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: { content: body.content } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    PROTOCOL_NOT_EDITABLE: 'Nicht bearbeitbar',
    TASKS_PROCESSING_FAILED: 'Verarbeitung fehlgeschlagen',
  },
}))

jest.mock('@/config/protocols', () => ({
  PROTOCOL_STATUSES: {
    DRAFT: 'draft',
    REVIEW: 'review',
  },
}))

const mockGetProtocolById = jest.fn()
const mockImportTasks = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getProtocolById: (...args: unknown[]) => mockGetProtocolById.apply(null, args),
  importTasks: (...args: unknown[]) => mockImportTasks.apply(null, args),
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

const MOCK_PROTOCOL = { id: 'proto-1', status: 'draft' }

const MOCK_IMPORT_RESULT = {
  success: true,
  taskCount: 3,
  model: 'claude-3-5-sonnet',
  source: 'ai',
}

const VALID_CONTENT = 'Task 1\nTask 2\nTask 3'

function makeRequest(body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/protocols/proto-1/import-tasks', body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: 'POST' }
  )
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockIsSuperAdmin.mockReturnValue(false)
  mockGetProtocolById.mockResolvedValue(MOCK_PROTOCOL)
  mockImportTasks.mockResolvedValue(MOCK_IMPORT_RESULT)
})

// ============================================================================
// POST — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/import-tasks — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/protocols/[id]/import-tasks — validation', () => {
  it('returns 400 when content is too short', async () => {
    const response = await POST(makeRequest({ content: 'short' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when content is absent', async () => {
    const response = await POST(makeRequest({}), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call importTasks when validation fails', async () => {
    await POST(makeRequest({ content: 'short' }), makeContext())
    expect(mockImportTasks).not.toHaveBeenCalled()
  })
})

// ============================================================================
// POST — protocol checks
// ============================================================================

describe('POST /api/protocols/[id]/import-tasks — protocol checks', () => {
  it('returns 404 when protocol is not found', async () => {
    mockGetProtocolById.mockResolvedValueOnce(null)
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when protocol status is finalized (not draft or review)', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ id: 'proto-1', status: 'finalized' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toBe('Nicht bearbeitbar')
  })

  it('allows import when status is review', async () => {
    mockGetProtocolById.mockResolvedValueOnce({ id: 'proto-1', status: 'review' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// POST — service errors
// ============================================================================

describe('POST /api/protocols/[id]/import-tasks — service errors', () => {
  it('returns 500 when importTasks returns { success: false }', async () => {
    mockImportTasks.mockResolvedValueOnce({ success: false, error: 'AI unavailable' })
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe('Verarbeitung fehlgeschlagen')
  })
})

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/protocols/[id]/import-tasks — success', () => {
  it('returns 200 with import result', async () => {
    const response = await POST(makeRequest({ content: VALID_CONTENT }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.imported).toBe(true)
    expect(body.data.taskCount).toBe(3)
    expect(body.data.model).toBe('claude-3-5-sonnet')
    expect(body.data.source).toBe('ai')
  })

  it('passes protocolId, content, and dbUserId to importTasks', async () => {
    await POST(makeRequest({ content: VALID_CONTENT }), makeContext('proto-99'))
    expect(mockImportTasks).toHaveBeenCalledWith('proto-99', VALID_CONTENT, 'db-user-1')
  })
})
