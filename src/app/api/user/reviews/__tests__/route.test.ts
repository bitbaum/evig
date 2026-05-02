/**
 * @jest-environment node
 *
 * Tests for GET /api/user/reviews
 *
 * Returns the authenticated user's reviews with Drizzle subqueries (.as()).
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
  parsePagination: () => ({ limit: 20, offset: 0 }),
}))

const mockSelect = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiError: (_: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    parsePagination: () => ({ limit: 20, offset: 0 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: { PUBLISHED: 'published', PENDING: 'pending' },
}))

jest.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
  REVIEW_TARGET_TYPES: { REPAIRER: 'repairer', WORKSHOP: 'workshop' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  sql: Object.assign((_s: TemplateStringsArray, ..._v: unknown[]) => ({ __sql: true }), {
    raw: (s: string) => ({ __raw: s }),
  }),
  desc: (a: unknown) => ({ __desc: a }),
  count: (a?: unknown) => ({ __count: a }),
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/db/schema/services', () => ({
  repairerProfiles: {
    id: 'rp_id',
    userId: 'rp_userId',
    businessName: 'rp_businessName',
  },
}))

jest.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'rv_id',
    reviewerId: 'rv_reviewerId',
    targetType: 'rv_targetType',
    targetId: 'rv_targetId',
    status: 'rv_status',
    rating: 'rv_rating',
    overallRating: 'rv_overallRating',
    communicationRating: 'rv_communicationRating',
    professionalismRating: 'rv_professionalismRating',
    qualityRating: 'rv_qualityRating',
    timelinessRating: 'rv_timelinessRating',
    valueRating: 'rv_valueRating',
    content: 'rv_content',
    title: 'rv_title',
    helpfulVotes: 'rv_helpfulVotes',
    totalVotes: 'rv_totalVotes',
    isVerifiedPurchase: 'rv_isVerifiedPurchase',
    createdAt: 'rv_createdAt',
    updatedAt: 'rv_updatedAt',
  },
  reviewResponses: {
    id: 'rr_id',
    reviewId: 'rr_reviewId',
    content: 'rr_content',
    status: 'rr_status',
    createdAt: 'rr_createdAt',
    responderId: 'rr_responderId',
  },
}))

jest.mock('@/db/schema/workshops', () => ({
  workshops: { id: 'w_id', title: 'w_title' },
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
    staffPermissions: [] as string[],
  },
  expires: '2027-01-01',
}

const MOCK_REVIEW_ROW = {
  id: 'rv-1',
  targetType: 'repairer',
  targetId: 'rp-1',
  targetName: 'Repair Shop',
  overallRating: 5,
  communicationRating: 5,
  professionalismRating: 5,
  qualityRating: 5,
  timelinessRating: 5,
  valueRating: 5,
  title: 'Excellent!',
  content: 'Great service',
  status: 'published',
  helpfulVotes: 2,
  totalVotes: 3,
  isVerifiedPurchase: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  responseId: null,
  responseContent: null,
  responseCreatedAt: null,
  responderName: null,
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Subquery objects returned by .as() — look like column maps so that
// publishedResponses.id / responder.name are plain strings, not functions.
// These are used as join targets and column references — never awaited.
const SUBQUERY_RESPONSES = {
  id: 'rr_id',
  reviewId: 'rr_reviewId',
  content: 'rr_content',
  createdAt: 'rr_createdAt',
  responderId: 'rr_responderId',
}

const SUBQUERY_RESPONDER = {
  id: 'resp_id',
  name: 'resp_name',
}

/**
 * Make a subquery chain (synchronous — all methods return chain, .as() returns alias).
 * Used for db.select().from(...).where(...).as('alias') and db.select().from(...).as('alias')
 */
function makeSubqueryChain(asResult: unknown) {
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.offset = jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(asResult)
  return chain
}

/**
 * Make a main query chain where the terminal method returns a resolved promise.
 * Used for the actual data queries (reviews, count).
 */
function makeChain(terminal: 'where' | 'offset', result: unknown[]) {
  const terminalFn = jest.fn().mockResolvedValue(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.where = terminal === 'where' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.offset = terminal === 'offset' ? terminalFn : jest.fn().mockReturnValue(chain)
  chain.as = jest.fn().mockReturnValue(chain)
  return chain
}

function makeRequest() {
  return new Request('http://localhost/api/user/reviews')
}

// ---------------------------------------------------------------------------
// Import under test
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
})

describe('GET /api/user/reviews', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeRequest() as never)
    expect(res.status).toBe(401)
  })

  it('returns 200 with reviews array and pagination', async () => {
    let callCount = 0
    mockSelect.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // publishedResponses subquery: .from(reviewResponses).where(...).as('rr')
        // Must return chain synchronously — .as() gives SUBQUERY_RESPONSES column map
        return makeSubqueryChain(SUBQUERY_RESPONSES)
      }
      if (callCount === 2) {
        // responder subquery: .from(users).as('responder')
        return makeSubqueryChain(SUBQUERY_RESPONDER)
      }
      if (callCount === 3) {
        // main reviews query — terminal is offset
        return makeChain('offset', [MOCK_REVIEW_ROW])
      }
      // count query — terminal is where
      return makeChain('where', [{ total: 1 }])
    })

    const res = await GET(makeRequest() as never)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.reviews)).toBe(true)
  })
})
