/**
 * @jest-environment node
 *
 * Tests for GET /api/blog/submit (admin submission list)
 *
 * Mission-relevant: admins review community blog posts through this endpoint.
 * If status filtering breaks, reviewers see wrong submissions. If the auth
 * guard fails, public users could access unpublished drafts.
 *
 * Behaviors locked:
 *   GET /api/blog/submit
 *   - returns 401 when not authenticated
 *   - returns 200 with submissions array
 *   - returns all submissions when no status filter
 *   - applies status filter when status param is present
 *   - does not filter when status=all
 *   - returns empty array when no submissions
 *   - returns 500 when DB throws
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

// Query chain: select().from().leftJoin().leftJoin().where().orderBy()
const mockOrderBy = jest.fn()
const mockQueryWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
const mockLeftJoin2 = jest.fn().mockReturnValue({ where: mockQueryWhere })
const mockLeftJoin1 = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin2 })
const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin1 })
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogSubmissions: {
    id: 'bs_id', submitterName: 'bs_submitterName', submitterEmail: 'bs_submitterEmail',
    userId: 'bs_userId', title: 'bs_title', slug: 'bs_slug', content: 'bs_content',
    excerpt: 'bs_excerpt', submissionType: 'bs_type', categoryId: 'bs_catId',
    categoryName: 'bs_catName', tags: 'bs_tags', status: 'bs_status',
    reviewedBy: 'bs_reviewedBy', reviewedAt: 'bs_reviewedAt', reviewNotes: 'bs_notes',
    rejectionReason: 'bs_rejection', publishedPostId: 'bs_postId',
    publishedAt: 'bs_publishedAt', submittedAt: 'bs_submittedAt',
  },
  blogCategories: { id: 'bc_id', name: 'bc_name' },
  users: { id: 'u_id', name: 'u_name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('drizzle-orm/pg-core', () => ({
  // Static (not jest.fn) so it survives jest.resetAllMocks() without re-setup
  alias: (_table: unknown, name: string) => ({ id: `${name}_id`, name: `${name}_name` }),
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
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_SUBMISSIONS = [
  { id: 'sub-1', title: 'Erster Beitrag', status: 'pending', submitter_name: 'Alice', reviewer_name: null },
  { id: 'sub-2', title: 'Zweiter Beitrag', status: 'approved', submitter_name: 'Bob', reviewer_name: 'Admin' },
]

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/blog/submit')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin1 })
  mockLeftJoin1.mockReturnValue({ leftJoin: mockLeftJoin2 })
  mockLeftJoin2.mockReturnValue({ where: mockQueryWhere })
  mockQueryWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue(MOCK_SUBMISSIONS)
})

// ============================================================================
// GET /api/blog/submit
// ============================================================================

describe('GET /api/blog/submit — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/blog/submit — authenticated', () => {
  it('returns 200', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns submissions array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions).toHaveLength(2)
  })

  it('returns empty array when no submissions', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions).toEqual([])
  })

  it('applies eq filter when status param is provided', async () => {
    await GET(makeRequest({ status: 'pending' }))
    const { eq } = await import('drizzle-orm')
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'pending')
  })

  it('does not apply eq filter when status=all', async () => {
    await GET(makeRequest({ status: 'all' }))
    const { eq } = await import('drizzle-orm')
    const statusCalls = (eq as jest.Mock).mock.calls.filter(c => c[1] === 'all')
    expect(statusCalls).toHaveLength(0)
  })

  it('returns 500 when DB throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('query timeout'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
