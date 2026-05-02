/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/blog/submissions/[id]
 *
 * Behaviors locked:
 *   GET  - 401, 404, 200
 *   PATCH - 401, 404, 400 (invalid action), 200 (approve)
 *   DELETE - 401, 404, 200
 */

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
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (r: Request, s: unknown, c: unknown) => unknown)(req, session, resolvedContext)
      })
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockAs = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockApproveSubmission = jest.fn()
const mockRejectSubmission = jest.fn()
const mockPublishSubmission = jest.fn()
const mockRequestChanges = jest.fn()
const mockEditSubmission = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  blogSubmissions: { id: 'bs_id', userId: 'bs_userId', title: 'bs_title', slug: 'bs_slug', status: 'bs_status', categoryId: 'bs_categoryId', reviewedBy: 'bs_reviewedBy', editHistory: 'bs_editHistory', lastEditedBy: 'bs_lastEditedBy', lastEditedAt: 'bs_lastEditedAt', submittedAt: 'bs_submittedAt', createdAt: 'bs_createdAt', updatedAt: 'bs_updatedAt', submitterName: 'bs_submitterName', submitterEmail: 'bs_submitterEmail', content: 'bs_content', excerpt: 'bs_excerpt', submissionType: 'bs_submissionType', categoryName: 'bs_categoryName', tags: 'bs_tags', reviewedAt: 'bs_reviewedAt', reviewNotes: 'bs_reviewNotes', rejectionReason: 'bs_rejectionReason', publishedPostId: 'bs_publishedPostId', publishedAt: 'bs_publishedAt' },
  blogCategories: { id: 'bc_id', name: 'bc_name' },
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
}))

jest.mock('@/lib/services/blog-submission', () => ({
  approveSubmission: (...args: unknown[]) => mockApproveSubmission.apply(null, args),
  rejectSubmission: (...args: unknown[]) => mockRejectSubmission.apply(null, args),
  publishSubmission: (...args: unknown[]) => mockPublishSubmission.apply(null, args),
  requestChanges: (...args: unknown[]) => mockRequestChanges.apply(null, args),
  editSubmission: (...args: unknown[]) => mockEditSubmission.apply(null, args),
  EditNotAllowedError: class EditNotAllowedError extends Error {},
  NoFieldsError: class NoFieldsError extends Error {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown) => NextResponse.json({ success: true, data }),
    apiError: (err: unknown, msg: string, status = 500) =>
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

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_SUBMISSION = { id: 'sub-1', title: 'Blog Post', status: 'pending', userId: 'u-1', reviewedBy: null, categoryId: null }

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/blog/submissions/sub-1', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
}

function makeContext(id = 'sub-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  // GET uses subquery: db.select().from(users).as('reviewer')
  // then main: db.select().from(blogSubmissions).leftJoin(×2).where()
  mockFrom
    .mockReturnValueOnce({ as: mockAs })               // subquery
    .mockReturnValueOnce({ leftJoin: mockLeftJoin, where: mockWhere })  // main GET query
  mockAs.mockReturnValue({ id: 'rev_id', name: 'rev_name', email: 'rev_email' })
  mockLeftJoin.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
  mockWhere.mockResolvedValue([MOCK_SUBMISSION])

  mockDeleteWhere.mockResolvedValue(undefined)

  mockApproveSubmission.mockResolvedValue({ ...MOCK_SUBMISSION, status: 'approved' })
  mockRejectSubmission.mockResolvedValue({ ...MOCK_SUBMISSION, status: 'rejected' })
})

describe('GET /api/admin/blog/submissions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/blog/submissions/[id] — authenticated', () => {
  it('returns 404 when submission not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 with submission', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.id).toBe('sub-1')
  })
})

describe('PATCH /api/admin/blog/submissions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { action: 'approve' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/blog/submissions/[id] — validation', () => {
  it('returns 404 when submission not found', async () => {
    // PATCH uses db.select().from().where() (no subquery, no joins)
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { action: 'approve' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 for invalid action', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([MOCK_SUBMISSION])
    const response = await PATCH(makeRequest('PATCH', { action: 'invalid_action' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/blog/submissions/[id] — success', () => {
  it('returns 200 on approve action', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([MOCK_SUBMISSION])
    const response = await PATCH(makeRequest('PATCH', { action: 'approve', review_notes: 'LGTM' }), makeContext())
    expect(response.status).toBe(200)
    expect(mockApproveSubmission).toHaveBeenCalledTimes(1)
  })
})

describe('DELETE /api/admin/blog/submissions/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/blog/submissions/[id] — authenticated', () => {
  it('returns 404 when submission not found', async () => {
    // DELETE uses db.select({id, title}).from().where()
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    mockFrom.mockReset()
    mockFrom.mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
    mockWhere.mockResolvedValueOnce([{ id: 'sub-1', title: 'Blog Post' }])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    expect(mockDeleteWhere).toHaveBeenCalledTimes(1)
  })
})
