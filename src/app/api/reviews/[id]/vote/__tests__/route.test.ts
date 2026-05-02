/**
 * @jest-environment node
 *
 * Tests for POST /api/reviews/[id]/vote
 *
 * Behaviors locked:
 *   POST - 401, 400 (invalid body), 404 (review not found), 400 (review not published),
 *          200 (remove vote - same voteType), 200 (change vote), 201 (new vote)
 */

const mockAuth = jest.fn()

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
}))

const mockSelect = jest.fn()
const mockTransaction = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}))

jest.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id', status: 'r_status', helpfulVotes: 'r_helpfulVotes',
    totalVotes: 'r_totalVotes', updatedAt: 'r_updatedAt',
  },
  reviewVotes: {
    reviewId: 'rv_reviewId', voterId: 'rv_voterId', voteType: 'rv_voteType',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/review-status', () => ({
  REVIEW_STATUS: {
    PUBLISHED: 'published',
    PENDING_MODERATION: 'pending_moderation',
    HIDDEN: 'hidden',
    DELETED: 'deleted',
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, _details?: unknown) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Internal Server Error' },
}))

jest.mock('@/lib/schemas', () => ({
  validateBody: jest.fn((_schema: unknown, body: unknown) => ({ success: true as const, data: body })),
  ReviewVoteSchema: {},
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const { validateBody } = jest.requireMock('@/lib/schemas')

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const PUBLISHED_REVIEW = { id: 'review-1', status: 'published' }

function setupSelectMocks(reviewRows: unknown[], existingVoteRows: unknown[]) {
  mockSelect.mockImplementation(() => {
    // Promise.all runs two selects in parallel; we use an index but mockImplementation is called per-chain
    // The route uses Promise.all([db.select...., db.select....])
    // Each call to db.select() returns a new chain. Track with a counter.
    const callCount = (mockSelect as jest.Mock).mock.calls.length
    if (callCount % 2 === 1) {
      // Odd calls: review query
      const mockWhere = jest.fn().mockResolvedValue(reviewRows)
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      return { from: mockFrom }
    } else {
      // Even calls: vote query
      const mockWhere = jest.fn().mockResolvedValue(existingVoteRows)
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
      return { from: mockFrom }
    }
  })
}

function setupTransactionMock() {
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }),
      update: jest.fn().mockReturnValue({ set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([]) }) }),
      insert: jest.fn().mockReturnValue({ values: jest.fn().mockResolvedValue([]) }),
    }
    return fn(tx)
  })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  validateBody.mockImplementation((_schema: unknown, body: unknown) => ({ success: true as const, data: body }))
  setupSelectMocks([PUBLISHED_REVIEW], [])
  setupTransactionMock()
})

// ============================================================================
// POST — vote on review
// ============================================================================

describe('POST /api/reviews/[id]/vote — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('POST /api/reviews/[id]/vote — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server') as { NextResponse: typeof import('next/server').NextResponse }
    validateBody.mockReturnValueOnce({
      success: false as const,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(400)
  })
})

describe('POST /api/reviews/[id]/vote — review not found', () => {
  it('returns 404 when review does not exist', async () => {
    setupSelectMocks([], [])
    const req = new NextRequest('http://localhost/api/reviews/nonexistent/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
  })
})

describe('POST /api/reviews/[id]/vote — review not published', () => {
  it('returns 400 when review is not published', async () => {
    setupSelectMocks([{ id: 'review-1', status: 'pending_moderation' }], [])
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/nicht verfügbar/)
  })
})

describe('POST /api/reviews/[id]/vote — new vote', () => {
  it('returns 201 when adding a new helpful vote', async () => {
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.action).toBe('added')
  })

  it('returns 201 when adding a new unhelpful vote', async () => {
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'unhelpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.action).toBe('added')
  })
})

describe('POST /api/reviews/[id]/vote — toggle vote', () => {
  it('returns 200 with action=removed when voting same type (toggle off)', async () => {
    setupSelectMocks([PUBLISHED_REVIEW], [{ voteType: 'helpful' }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.action).toBe('removed')
  })

  it('returns 200 with action=updated when changing vote type', async () => {
    setupSelectMocks([PUBLISHED_REVIEW], [{ voteType: 'unhelpful' }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/vote', {
      method: 'POST',
      body: JSON.stringify({ voteType: 'helpful' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.action).toBe('updated')
  })
})
