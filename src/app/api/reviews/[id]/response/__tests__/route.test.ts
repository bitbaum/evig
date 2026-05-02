/**
 * @jest-environment node
 *
 * Tests for POST /api/reviews/[id]/response, PUT /api/reviews/[id]/response,
 * and DELETE /api/reviews/[id]/response
 *
 * Behaviors locked:
 *   POST   - 401, 404 (review not found), 403 (not the repairer), 400 (response exists), 201 (success)
 *   PUT    - 401, 404 (response not found), 403 (not owner/admin/repairer), 200 (success)
 *   DELETE - 401, 404 (response not found), 403 (not owner/admin/repairer), 200 (success)
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
const mockInsert = jest.fn()
const mockUpdate = jest.fn()
const mockDelete = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => mockInsert(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}))

jest.mock('@/db/schema/reviews', () => ({
  reviews: {
    id: 'r_id', targetType: 'r_targetType', targetId: 'r_targetId', reviewerId: 'r_reviewerId',
  },
  reviewResponses: {
    id: 'rr_id', reviewId: 'rr_reviewId', responderId: 'rr_responderId',
    content: 'rr_content', status: 'rr_status', updatedAt: 'rr_updatedAt',
  },
}))

jest.mock('@/db/schema/services', () => ({
  repairerProfiles: { id: 'rp_id', userId: 'rp_userId' },
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
  ReviewResponseSchema: {},
}))

import { NextRequest } from 'next/server'
import { POST, PUT, DELETE } from '../route'

const { validateBody } = jest.requireMock('@/lib/schemas')

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_REPAIRER_SESSION = {
  user: { id: 'repairer-1', email: 'repairer@example.com', name: 'Repairer', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

const MOCK_ADMIN_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[] },
  expires: '2027-01-01',
}

// Shared review row with repairer target
const MOCK_REVIEW = {
  id: 'review-1',
  targetType: 'repairer',
  targetId: 'repairer-profile-1',
  repairerUserId: 'repairer-1',
}

let selectCallIndex: number

function setupPostSelectMocks(reviewRows: unknown[], existingResponseRows: unknown[]) {
  selectCallIndex = 0
  mockSelect.mockImplementation(() => {
    selectCallIndex++
    if (selectCallIndex === 1) {
      // First select: get review + repairer join
      const chainObj: Record<string, jest.Mock> = {}
      const mockWhere = jest.fn().mockResolvedValue(reviewRows)
      const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere })
      chainObj.leftJoin = mockLeftJoin
      chainObj.where = mockWhere
      const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin, where: mockWhere })
      return { from: mockFrom }
    }
    // Second select: check existing response
    const mockWhere = jest.fn().mockResolvedValue(existingResponseRows)
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
    return { from: mockFrom }
  })
}

function setupPutDeleteSelectMocks(responseRows: unknown[]) {
  const chainObj: Record<string, jest.Mock> = {}
  const mockWhere = jest.fn().mockResolvedValue(responseRows)
  const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere })
  const mockInnerJoin = jest.fn().mockReturnValue(chainObj)
  chainObj.leftJoin = mockLeftJoin
  chainObj.innerJoin = mockInnerJoin
  chainObj.where = mockWhere
  const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin })
  mockSelect.mockReturnValue({ from: mockFrom })
}

function setupInsertMock(responseId = 'response-1') {
  const mockReturning = jest.fn().mockResolvedValue([{ id: responseId }])
  const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
  mockInsert.mockReturnValue({ values: mockValues })
}

function setupUpdateMock() {
  const mockWhere = jest.fn().mockResolvedValue([])
  const mockSet = jest.fn().mockReturnValue({ where: mockWhere })
  mockUpdate.mockReturnValue({ set: mockSet })
}

function setupDeleteMock() {
  const mockWhere = jest.fn().mockResolvedValue([])
  mockDelete.mockReturnValue({ where: mockWhere })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_REPAIRER_SESSION)
  validateBody.mockImplementation((_schema: unknown, body: unknown) => ({ success: true as const, data: body }))
  setupPostSelectMocks([MOCK_REVIEW], [])
  setupInsertMock()
  setupUpdateMock()
  setupDeleteMock()
})

// ============================================================================
// POST — create response
// ============================================================================

describe('POST /api/reviews/[id]/response — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'POST',
      body: JSON.stringify({ content: 'Thank you for your review!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('POST /api/reviews/[id]/response — review not found', () => {
  it('returns 404 when review does not exist', async () => {
    setupPostSelectMocks([], [])
    const req = new NextRequest('http://localhost/api/reviews/nonexistent/response', {
      method: 'POST',
      body: JSON.stringify({ content: 'Thank you for your review!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    expect(response.status).toBe(404)
  })
})

describe('POST /api/reviews/[id]/response — permission check', () => {
  it('returns 403 when user is not the repairer', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_SESSION) // not the repairer
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'POST',
      body: JSON.stringify({ content: 'Thank you for your review!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(403)
    const body = await response.json()
    expect(body.error).toMatch(/Reparateur/)
  })
})

describe('POST /api/reviews/[id]/response — duplicate check', () => {
  it('returns 400 when response already exists', async () => {
    setupPostSelectMocks([MOCK_REVIEW], [{ id: 'existing-response' }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'POST',
      body: JSON.stringify({ content: 'Thank you for your review!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toMatch(/bereits/)
  })
})

describe('POST /api/reviews/[id]/response — success', () => {
  it('returns 201 when repairer creates a response', async () => {
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'POST',
      body: JSON.stringify({ content: 'Thank you for your review!' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.responseId).toBe('response-1')
  })
})

// ============================================================================
// PUT — update response
// ============================================================================

describe('PUT /api/reviews/[id]/response — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated response content here' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('PUT /api/reviews/[id]/response — not found', () => {
  it('returns 404 when response does not exist', async () => {
    setupPutDeleteSelectMocks([])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated response content here' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(404)
  })
})

describe('PUT /api/reviews/[id]/response — permission check', () => {
  it('returns 403 when user is not owner, not admin, and not repairer', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_SESSION) // user-1, not repairer-1 and not admin
    setupPutDeleteSelectMocks([{
      id: 'response-1',
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Someone else trying to edit' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(403)
  })
})

describe('PUT /api/reviews/[id]/response — success', () => {
  it('returns 200 when repairer (owner) updates response', async () => {
    setupPutDeleteSelectMocks([{
      id: 'response-1',
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Updated response content here' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
  })

  it('returns 200 when admin updates any response', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION)
    setupPutDeleteSelectMocks([{
      id: 'response-1',
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', {
      method: 'PUT',
      body: JSON.stringify({ content: 'Admin updating response content' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await PUT(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE — delete response
// ============================================================================

describe('DELETE /api/reviews/[id]/response — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/reviews/[id]/response — not found', () => {
  it('returns 404 when response does not exist', async () => {
    setupPutDeleteSelectMocks([])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/reviews/[id]/response — permission check', () => {
  it('returns 403 when user is not owner, not admin, and not repairer', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_SESSION) // user-1 — not owner/repairer/admin
    setupPutDeleteSelectMocks([{
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(403)
  })
})

describe('DELETE /api/reviews/[id]/response — success', () => {
  it('returns 200 when repairer deletes own response', async () => {
    setupPutDeleteSelectMocks([{
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('returns 200 when admin deletes any response', async () => {
    mockAuth.mockResolvedValueOnce(MOCK_ADMIN_SESSION)
    setupPutDeleteSelectMocks([{
      responderId: 'repairer-1',
      targetType: 'repairer',
      repairerUserId: 'repairer-1',
    }])
    const req = new NextRequest('http://localhost/api/reviews/review-1/response', { method: 'DELETE' })
    const response = await DELETE(req, { params: Promise.resolve({ id: 'review-1' }) })
    expect(response.status).toBe(200)
  })
})
