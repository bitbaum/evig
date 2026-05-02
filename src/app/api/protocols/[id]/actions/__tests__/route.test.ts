/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/protocols/[id]/actions
 *
 * GET retrieves action item links for a protocol.
 * POST links an action item to either a task or a decision.
 * Incorrect link_type routing or missing data checks would silently create
 * orphaned records in the non-profit's governance system.
 *
 * Behaviors locked:
 *   GET /api/protocols/[id]/actions
 *   - returns 401 when not authenticated
 *   - returns 200 with links array
 *
 *   POST /api/protocols/[id]/actions
 *   - returns 401 when not authenticated
 *   - returns 400 when body is invalid (missing action_item_id or link_type)
 *   - returns 400 when link_type is task but task_data is absent
 *   - returns 400 when link_type is decision but decision_data is absent
 *   - returns 201 with { taskId, linkId } when task linked successfully
 *   - returns 201 with { decisionId, linkId } when decision linked successfully
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
  linkActionSchema: {
    safeParse: (b: unknown) => {
      const body = b as Record<string, unknown>
      if (!body?.action_item_id || !body?.link_type) {
        return { success: false, error: { flatten: () => ({ fieldErrors: {} }) } }
      }
      return { success: true, data: body }
    },
  },
}))

const mockGetActionLinks = jest.fn()
const mockLinkActionItemToTask = jest.fn()
const mockLinkActionItemToDecision = jest.fn()

jest.mock('@/lib/services/protocols', () => ({
  getActionLinks: (...args: unknown[]) => mockGetActionLinks.apply(null, args),
  linkActionItemToTask: (...args: unknown[]) => mockLinkActionItemToTask.apply(null, args),
  linkActionItemToDecision: (...args: unknown[]) => mockLinkActionItemToDecision.apply(null, args),
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

const MOCK_LINKS = [
  { id: 'link-1', action_item_id: 'item-1', link_type: 'task', task_id: 'task-1' },
  { id: 'link-2', action_item_id: 'item-2', link_type: 'decision', decision_id: 'dec-1' },
]

function makeGetRequest() {
  return new NextRequest('http://localhost/api/protocols/proto-1/actions', { method: 'GET' })
}

function makePostRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/protocols/proto-1/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'proto-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-user-1' })
  mockGetActionLinks.mockResolvedValue(MOCK_LINKS)
  mockLinkActionItemToTask.mockResolvedValue({ taskId: 'task-new', linkId: 'link-new' })
  mockLinkActionItemToDecision.mockResolvedValue({ decisionId: 'dec-new', linkId: 'link-new' })
})

// ============================================================================
// GET /api/protocols/[id]/actions
// ============================================================================

describe('GET /api/protocols/[id]/actions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/protocols/[id]/actions — authenticated', () => {
  it('returns 200 with links array', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toEqual(MOCK_LINKS)
  })

  it('passes protocolId to getActionLinks', async () => {
    await GET(makeGetRequest(), makeContext('proto-42'))
    expect(mockGetActionLinks).toHaveBeenCalledWith('proto-42')
  })
})

// ============================================================================
// POST /api/protocols/[id]/actions — unauthenticated
// ============================================================================

describe('POST /api/protocols/[id]/actions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(
      makePostRequest({ action_item_id: 'item-1', link_type: 'task', task_data: {} }),
      makeContext()
    )
    expect(response.status).toBe(401)
  })
})

// ============================================================================
// POST /api/protocols/[id]/actions — validation
// ============================================================================

describe('POST /api/protocols/[id]/actions — validation', () => {
  it('returns 400 when body is missing action_item_id', async () => {
    const response = await POST(makePostRequest({ link_type: 'task' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when body is missing link_type', async () => {
    const response = await POST(makePostRequest({ action_item_id: 'item-1' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('does not call linkActionItemToTask when validation fails', async () => {
    await POST(makePostRequest({}), makeContext())
    expect(mockLinkActionItemToTask).not.toHaveBeenCalled()
  })

  it('returns 400 when link_type is task but task_data is absent', async () => {
    const response = await POST(
      makePostRequest({ action_item_id: 'item-1', link_type: 'task' }),
      makeContext()
    )
    expect(response.status).toBe(400)
  })

  it('returns 400 when link_type is decision but decision_data is absent', async () => {
    const response = await POST(
      makePostRequest({ action_item_id: 'item-1', link_type: 'decision' }),
      makeContext()
    )
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST /api/protocols/[id]/actions — success (task)
// ============================================================================

describe('POST /api/protocols/[id]/actions — task link success', () => {
  it('returns 201 with taskId and linkId when task linked', async () => {
    const response = await POST(
      makePostRequest({
        action_item_id: 'item-1',
        link_type: 'task',
        task_data: { title: 'Neue Aufgabe' },
      }),
      makeContext()
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.taskId).toBe('task-new')
    expect(body.data.linkId).toBe('link-new')
  })

  it('passes protocolId, action_item_id, task_data, and dbUserId to linkActionItemToTask', async () => {
    const taskData = { title: 'Neue Aufgabe' }
    await POST(
      makePostRequest({ action_item_id: 'item-42', link_type: 'task', task_data: taskData }),
      makeContext('proto-99')
    )
    expect(mockLinkActionItemToTask).toHaveBeenCalledWith(
      'proto-99',
      'item-42',
      taskData,
      'db-user-1'
    )
  })
})

// ============================================================================
// POST /api/protocols/[id]/actions — success (decision)
// ============================================================================

describe('POST /api/protocols/[id]/actions — decision link success', () => {
  it('returns 201 with decisionId and linkId when decision linked', async () => {
    const response = await POST(
      makePostRequest({
        action_item_id: 'item-1',
        link_type: 'decision',
        decision_data: { title: 'Neue Entscheidung' },
      }),
      makeContext()
    )
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.decisionId).toBe('dec-new')
    expect(body.data.linkId).toBe('link-new')
  })

  it('passes protocolId, action_item_id, decision_data, and dbUserId to linkActionItemToDecision', async () => {
    const decisionData = { title: 'Neue Entscheidung' }
    await POST(
      makePostRequest({
        action_item_id: 'item-42',
        link_type: 'decision',
        decision_data: decisionData,
      }),
      makeContext('proto-99')
    )
    expect(mockLinkActionItemToDecision).toHaveBeenCalledWith(
      'proto-99',
      'item-42',
      decisionData,
      'db-user-1'
    )
  })
})
