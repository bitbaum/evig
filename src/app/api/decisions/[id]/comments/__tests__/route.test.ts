/**
 * @jest-environment node
 *
 * Tests for GET/POST /api/decisions/[id]/comments
 *
 * Mission-relevant: decision comments are the deliberation record. POST must
 * enforce status guards (non-commentable decisions can't receive new comments).
 *
 * Behaviors locked:
 *   GET /api/decisions/[id]/comments
 *   - returns 401 when not authenticated
 *   - returns 200 with comments array
 *   - returns 500 when service throws
 *
 *   POST /api/decisions/[id]/comments
 *   - returns 401 when not authenticated
 *   - returns 400 when body invalid
 *   - returns 404 when decision not found
 *   - returns 400 when decision is not commentable
 *   - returns 201 with created comment
 *   - returns 500 when service throws
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
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params
          ? { params: await context.params }
          : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockGetDbUserId = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId.apply(null, args),
}))

const mockGetComments = jest.fn()
const mockCreateComment = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  getComments: (...args: unknown[]) => mockGetComments.apply(null, args),
  createComment: (...args: unknown[]) => mockCreateComment.apply(null, args),
}))

jest.mock('@/lib/schemas/decisions', () => ({
  // Static so it survives jest.resetAllMocks()
  createCommentSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.content) return { success: false, error: { issues: [{ message: 'Kommentar ist erforderlich' }] } }
      return { success: true, data: { content: b.content } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALL_FIELDS_REQUIRED: 'All fields required',
    DECISION_NOT_EDITABLE: 'Entscheidung kann nicht bearbeitet werden',
    COMMENT_CREATE_FAILED: 'Kommentar konnte nicht erstellt werden',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string) =>
      NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_COMMENTS = [
  { id: 'cmt-1', content: 'Ich stimme zu.', userId: 'user-1', createdAt: '2026-05-01' },
  { id: 'cmt-2', content: 'Guter Vorschlag.', userId: 'user-2', createdAt: '2026-05-02' },
]

const MOCK_COMMENT = { id: 'cmt-new', content: 'Neuer Kommentar', userId: 'admin-1', createdAt: '2026-05-03' }

function makeGetRequest() {
  return new NextRequest('http://localhost/api/decisions/dec-1/comments')
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/decisions/dec-1/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeContext(id = 'dec-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-admin-1' })
  mockGetComments.mockResolvedValue(MOCK_COMMENTS)
  mockCreateComment.mockResolvedValue({ comment: MOCK_COMMENT })
})

// ============================================================================
// GET /api/decisions/[id]/comments
// ============================================================================

describe('GET /api/decisions/[id]/comments — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/decisions/[id]/comments — authenticated', () => {
  it('returns 200 with comments', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns comments array', async () => {
    const response = await GET(makeGetRequest(), makeContext())
    const body = await response.json()
    expect(body.data).toHaveLength(2)
  })

  it('passes decision id to service', async () => {
    await GET(makeGetRequest(), makeContext('dec-99'))
    expect(mockGetComments).toHaveBeenCalledWith('dec-99')
  })

  it('returns 500 when service throws', async () => {
    mockGetComments.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest(), makeContext())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/decisions/[id]/comments
// ============================================================================

describe('POST /api/decisions/[id]/comments — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ content: 'test' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('POST /api/decisions/[id]/comments — validation', () => {
  it('returns 400 when content is missing', async () => {
    const response = await POST(makePostRequest({}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/decisions/[id]/comments — service errors', () => {
  it('returns 404 when decision not found', async () => {
    mockCreateComment.mockResolvedValueOnce({ error: 'not_found' })
    const response = await POST(makePostRequest({ content: 'Test' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when decision is not commentable', async () => {
    mockCreateComment.mockResolvedValueOnce({ error: 'not_commentable' })
    const response = await POST(makePostRequest({ content: 'Test' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('POST /api/decisions/[id]/comments — success', () => {
  it('returns 201 with created comment', async () => {
    const response = await POST(makePostRequest({ content: 'Neuer Kommentar' }), makeContext())
    expect(response.status).toBe(201)
  })

  it('returns the comment data', async () => {
    const response = await POST(makePostRequest({ content: 'Neuer Kommentar' }), makeContext())
    const body = await response.json()
    expect(body.data.id).toBe('cmt-new')
  })

  it('returns 500 when service throws', async () => {
    mockCreateComment.mockRejectedValueOnce(new Error('DB error'))
    const response = await POST(makePostRequest({ content: 'Test' }), makeContext())
    expect(response.status).toBe(500)
  })
})
