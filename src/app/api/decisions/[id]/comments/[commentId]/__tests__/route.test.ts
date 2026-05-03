/**
 * @jest-environment node
 *
 * Tests for PATCH/DELETE /api/decisions/[id]/comments/[commentId]
 *
 * Mission-relevant: comment ownership is enforced at the API level — only the
 * original author can edit/delete their comment. Misrouting these errors would
 * allow any admin to silently erase others' comments.
 *
 * Behaviors locked:
 *   PATCH /api/decisions/[id]/comments/[commentId]
 *   - returns 401 when not authenticated
 *   - returns 400 when content missing
 *   - returns 404 when comment not found
 *   - returns 400 when user is not the author
 *   - returns 200 with updated comment
 *
 *   DELETE /api/decisions/[id]/comments/[commentId]
 *   - returns 401 when not authenticated
 *   - returns 404 when comment not found
 *   - returns 400 when user is not the author
 *   - returns 200 with null data on success
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
    return (req: Request, context?: { params?: Promise<{ id: string; commentId: string }> }) =>
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

const mockUpdateComment = jest.fn()
const mockDeleteComment = jest.fn()

jest.mock('@/lib/services/decisions', () => ({
  updateComment: (...args: unknown[]) => mockUpdateComment.apply(null, args),
  deleteComment: (...args: unknown[]) => mockDeleteComment.apply(null, args),
}))

jest.mock('@/lib/schemas/decisions', () => ({
  updateCommentSchema: {
    safeParse: (body: unknown) => {
      const b = body as Record<string, unknown>
      if (!b?.content) return { success: false, error: { issues: [{ message: 'Inhalt erforderlich' }] } }
      return { success: true, data: { content: b.content } }
    },
  },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: {
    INTERNAL_SERVER_ERROR: 'Internal server error',
    ALL_FIELDS_REQUIRED: 'All fields required',
    COMMENT_NOT_AUTHOR: 'Du bist nicht der Autor dieses Kommentars',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
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
import { PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_COMMENT = { id: 'cmt-1', content: 'Updated text', userId: 'admin-1', createdAt: '2026-05-01' }

function makeRequest(method: string, body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/decisions/dec-1/comments/cmt-1', body
    ? { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: method }
  )
}

function makeContext(commentId = 'cmt-1') {
  return { params: Promise.resolve({ id: 'dec-1', commentId }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'db-admin-1' })
  mockUpdateComment.mockResolvedValue({ comment: MOCK_COMMENT })
  mockDeleteComment.mockResolvedValue({ deleted: true })
})

// ============================================================================
// PATCH /api/decisions/[id]/comments/[commentId]
// ============================================================================

describe('PATCH /api/decisions/[id]/comments/[commentId] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { content: 'test' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/decisions/[id]/comments/[commentId] — validation', () => {
  it('returns 400 when content is missing', async () => {
    const response = await PATCH(makeRequest('PATCH', {}), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/decisions/[id]/comments/[commentId] — service errors', () => {
  it('returns 404 when comment not found', async () => {
    mockUpdateComment.mockResolvedValueOnce({ error: 'not_found' })
    const response = await PATCH(makeRequest('PATCH', { content: 'Updated' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when user is not the author', async () => {
    mockUpdateComment.mockResolvedValueOnce({ error: 'not_author' })
    const response = await PATCH(makeRequest('PATCH', { content: 'Updated' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/decisions/[id]/comments/[commentId] — success', () => {
  it('returns 200 with updated comment', async () => {
    const response = await PATCH(makeRequest('PATCH', { content: 'Updated text' }), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.content).toBe('Updated text')
  })
})

// ============================================================================
// DELETE /api/decisions/[id]/comments/[commentId]
// ============================================================================

describe('DELETE /api/decisions/[id]/comments/[commentId] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/decisions/[id]/comments/[commentId] — service errors', () => {
  it('returns 404 when comment not found', async () => {
    mockDeleteComment.mockResolvedValueOnce({ error: 'not_found' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when user is not the author', async () => {
    mockDeleteComment.mockResolvedValueOnce({ error: 'not_author' })
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('DELETE /api/decisions/[id]/comments/[commentId] — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns 500 when service throws', async () => {
    mockDeleteComment.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})
