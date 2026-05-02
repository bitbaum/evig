/**
 * @jest-environment node
 *
 * Tests for GET /api/reviews/[id], PUT /api/reviews/[id], DELETE /api/reviews/[id]
 *
 * Behaviors locked:
 *   GET    - 404 (not found), 404 (pending without admin), 200 (published), 200 admin sees any status
 *   PUT    - 401, 404, 403 (not owner), 200 (owner can update within 30 days)
 *   DELETE - 401, 404, 403 (not owner, not admin), 200 (owner deletes), 200 (admin deletes)
 */

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
}))

const mockSelect = jest.fn()
const mockUpdate = jest.fn()
const mockInsert = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
  },
}))

jest.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id', reviewerId: 'r_reviewerId', targetType: 'r_targetType', targetId: 'r_targetId',
    bookingId: 'r_bookingId', overallRating: 'r_overallRating', communicationRating: 'r_communicationRating',
    professionalismRating: 'r_professionalismRating', qualityRating: 'r_qualityRating',
    timelinessRating: 'r_timelinessRating', valueRating: 'r_valueRating', title: 'r_title',
    content: 'r_content', isVerifiedPurchase: 'r_isVerifiedPurchase', helpfulVotes: 'r_helpfulVotes',
    totalVotes: 'r_totalVotes', status: 'r_status', createdAt: 'r_createdAt', updatedAt: 'r_updatedAt',
    moderationReason: 'r_moderationReason', moderatedBy: 'r_moderatedBy', moderatedAt: 'r_moderatedAt',
  },
  reviewResponses: {
    reviewId: 'rr_reviewId', id: 'rr_id', content: 'rr_content',
    createdAt: 'rr_createdAt', responderId: 'rr_responderId', status: 'rr_status',
  },
  reviewAttachments: {
    id: 'ra_id', reviewId: 'ra_reviewId', originalFilename: 'ra_originalFilename',
    filePath: 'ra_filePath', mimeType: 'ra_mimeType', attachmentType: 'ra_attachmentType',
    sortOrder: 'ra_sortOrder', createdAt: 'ra_createdAt',
  },
  reviewModerationLog: {
    reviewId: 'rml_reviewId', action: 'rml_action', reason: 'rml_reason',
    adminId: 'rml_adminId', oldStatus: 'rml_oldStatus', newStatus: 'rml_newStatus',
  },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/db/schema/services', () => ({
  repairerProfiles: { id: 'rp_id', businessName: 'rp_businessName', userId: 'rp_userId' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

jest.mock('@/config/database', () => ({
  REVIEW_TARGET_TYPES: {
    REPAIRER: 'repairer', SERVICE: 'service', WORKSHOP: 'workshop',
    IT_HILFE: 'it_hilfe', LISTING: 'listing',
  },
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
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiNotFound: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 404 }),
    apiForbidden: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 403 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { UNAUTHORIZED: 'Unauthorized', INTERNAL_SERVER_ERROR: 'Internal Server Error' },
}))

jest.mock('@/lib/schemas', () => {
  return {
    validateBody: jest.fn((schema: unknown, body: unknown) => ({ success: true as const, data: body })),
    UpdateReviewSchema: {},
  }
})

import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '../route'

const { validateBody } = jest.requireMock('@/lib/schemas')

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[] },
  expires: '2027-01-01',
}

const MOCK_REVIEW_ROW = {
  id: 'review-1',
  reviewerId: 'user-1',
  targetType: 'repairer',
  targetId: 'target-1',
  bookingId: null,
  overallRating: 4,
  communicationRating: null,
  professionalismRating: null,
  qualityRating: null,
  timelinessRating: null,
  valueRating: null,
  title: 'Good service',
  content: 'Very helpful technician',
  isVerifiedPurchase: false,
  helpfulVotes: 0,
  totalVotes: 0,
  status: 'published',
  moderationReason: null,
  moderatedBy: null,
  moderatedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  reviewerName: 'Test User',
  reviewerEmail: 'user@example.com',
  targetName: 'Fix It Shop',
  responseId: null,
  responseContent: null,
  responseCreatedAt: null,
  responderName: null,
}

// Track call counts to distinguish main query from attachments query
let selectCallIndex: number

function setupSelectMocks(reviewRows: unknown[], attachmentRows: unknown[] = []) {
  selectCallIndex = 0
  mockSelect.mockImplementation(() => {
    selectCallIndex++
    const callIdx = selectCallIndex

    // Calls 1-2 are subqueries (.from().where().as() or .from().as())
    if (callIdx <= 2) {
      const subAs = jest.fn().mockReturnValue({
        id: 'sub_id', name: 'sub_name', reviewId: 'sub_reviewId',
        content: 'sub_content', createdAt: 'sub_createdAt', responderId: 'sub_responderId',
      })
      const subWhere = jest.fn().mockReturnValue({ as: subAs })
      const subFrom = jest.fn().mockReturnValue({ as: subAs, where: subWhere })
      return { from: subFrom }
    }

    // Call 3: main review query chain
    if (callIdx === 3) {
      const chainObj: Record<string, jest.Mock> = {}
      const mockWhere = jest.fn().mockResolvedValue(reviewRows)
      const mockLeftJoin = jest.fn().mockReturnValue(chainObj)
      const mockInnerJoin = jest.fn().mockReturnValue(chainObj)
      chainObj.leftJoin = mockLeftJoin
      chainObj.innerJoin = mockInnerJoin
      chainObj.where = mockWhere
      const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin, leftJoin: mockLeftJoin })
      return { from: mockFrom }
    }

    // Call 4: attachments query chain
    const mockOrderBy = jest.fn().mockResolvedValue(attachmentRows)
    const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    return { from: mockFrom }
  })
}

function setupUpdateMock() {
  const mockWhere = jest.fn().mockResolvedValue([])
  const mockSet = jest.fn().mockReturnValue({ where: mockWhere })
  mockUpdate.mockReturnValue({ set: mockSet })
}

function setupInsertMock() {
  const mockReturning = jest.fn().mockResolvedValue([])
  const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
  mockInsert.mockReturnValue({ values: mockValues })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  validateBody.mockImplementation((_schema: unknown, body: unknown) => ({ success: true as const, data: body }))
  setupSelectMocks([MOCK_REVIEW_ROW])
  setupUpdateMock()
  setupInsertMock()
})

// ============================================================================
// GET — single review
// ============================================================================

describe('GET /api/reviews/[id] — public access', () => {
  it('returns 200 for published review', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.review.id).toBe('review-1')
  })

  it('returns 404 when review not found', async () => {
    setupSelectMocks([])
    const req = new NextRequest('http://localhost/api/reviews/nonexistent')
    const response = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
  })

  it('returns 404 for pending review when not admin', async () => {
    setupSelectMocks([{ ...MOCK_REVIEW_ROW, status: 'pending_moderation' }])
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(404)
  })

  it('returns 200 for pending review when admin', async () => {
    setupSelectMocks([{ ...MOCK_REVIEW_ROW, status: 'pending_moderation' }])
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION)
    const req = new NextRequest('http://localhost/api/reviews/review-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
  })

  it('exposes moderation fields to admin only', async () => {
    setupSelectMocks([{ ...MOCK_REVIEW_ROW, moderationReason: 'spam' }])
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION)
    const req = new NextRequest('http://localhost/api/reviews/review-1')
    const response = await GET(req, { params: Promise.resolve({ id: 'review-1' }) })
    const body = await response.json()
    expect(body.data.review.moderationReason).toBe('spam')
    expect(body.data.review.reviewerEmail).toBe('user@example.com')
  })
})

// ============================================================================
// PUT — update review
// ============================================================================

describe('PUT /api/reviews/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1', {
      method: 'PUT',
      body: JSON.stringify({ overallRating: 5, content: 'Updated content here!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/reviews/[id] — not found', () => {
  it('returns 404 when review does not exist', async () => {
    // For PUT, only one select call (no subqueries), so override mockSelect directly
    const mockWhere = jest.fn().mockResolvedValue([])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/nonexistent', {
      method: 'PUT',
      body: JSON.stringify({ overallRating: 5, content: 'Updated content here!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/reviews/[id] — ownership check', () => {
  it('returns 403 when user does not own the review', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{
      id: 'review-1',
      reviewerId: 'other-user',
      createdAt: new Date(),
      status: 'published',
    }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', {
      method: 'PUT',
      body: JSON.stringify({ overallRating: 3, content: 'Changed my mind about this!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(403)
  })
})

describe('PUT /api/reviews/[id] — success', () => {
  it('returns 200 when owner updates within 30 days', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{
      id: 'review-1',
      reviewerId: 'user-1',
      createdAt: new Date(),
      status: 'published',
    }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', {
      method: 'PUT',
      body: JSON.stringify({ overallRating: 5, content: 'Actually it was great!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.reviewId).toBe('review-1')
  })

  it('returns 400 when review is older than 30 days', async () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 31)
    const mockWhere = jest.fn().mockResolvedValue([{
      id: 'review-1',
      reviewerId: 'user-1',
      createdAt: oldDate,
      status: 'published',
    }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', {
      method: 'PUT',
      body: JSON.stringify({ overallRating: 2, content: 'Changing old review content!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/30 Tagen/)
  })
})

// ============================================================================
// DELETE — delete review
// ============================================================================

describe('DELETE /api/reviews/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/reviews/[id] — not found', () => {
  it('returns 404 when review does not exist', async () => {
    const mockWhere = jest.fn().mockResolvedValue([])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/nonexistent', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/reviews/[id] — ownership check', () => {
  it('returns 403 when user is not owner and not admin', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{ reviewerId: 'other-user' }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/reviews/[id] — success', () => {
  it('returns 200 when owner deletes own review', async () => {
    const mockWhere = jest.fn().mockResolvedValue([{ reviewerId: 'user-1' }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.reviewId).toBe('review-1')
  })

  it('returns 200 when admin deletes any review', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION)
    const mockWhere = jest.fn().mockResolvedValue([{ reviewerId: 'other-user' }])
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    mockSelect.mockReturnValue({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/reviews/review-1', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
  })
})
