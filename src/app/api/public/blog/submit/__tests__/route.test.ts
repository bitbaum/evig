/**
 * @jest-environment node
 *
 * Tests for POST /api/public/blog/submit (public, optional auth)
 *
 * Behaviors locked:
 *   POST - 429 (rate limited), 400 (invalid body), 200 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

const mockCheckRateLimit = jest.fn()
const mockGetClientIp = jest.fn()

jest.mock('@/lib/auth/rate-limiter', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: (...args: unknown[]) => mockGetClientIp(...args),
}))

const mockSendEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'https://revampit.test',
}))

const mockGenerateSlug = jest.fn()

jest.mock('@/lib/utils/slug', () => ({
  generateSlug: (...args: unknown[]) => mockGenerateSlug(...args),
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    REQUIRES_CHANGES: 'requires_changes',
    PUBLISHED: 'published',
  },
}))

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockWhere = jest.fn()
const mockInsert = jest.fn()
const mockValues = jest.fn()
const mockReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    insert: (...args: unknown[]) => { mockInsert(...args); return { values: mockValues } },
  },
}))

jest.mock('@/db/schema', () => ({
  blogCategories: {
    id: 'bc_id',
    name: 'bc_name',
    slug: 'bc_slug',
  },
  blogSubmissions: {
    id: 'bs_id',
    submitterName: 'bs_submitterName',
    submitterEmail: 'bs_submitterEmail',
    userId: 'bs_userId',
    title: 'bs_title',
    slug: 'bs_slug',
    content: 'bs_content',
    submissionType: 'bs_submissionType',
    categoryId: 'bs_categoryId',
    categoryName: 'bs_categoryName',
    tags: 'bs_tags',
    status: 'bs_status',
  },
  users: {
    id: 'u_id',
    email: 'u_email',
    isStaff: 'u_isStaff',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
  and: (...args: unknown[]) => ({ __and: args }),
  or: (...args: unknown[]) => ({ __or: args }),
  isNotNull: (a: unknown) => ({ __isNotNull: a }),
  sql: Object.assign(
    (_strings: TemplateStringsArray, ..._values: unknown[]) => ({ __sql: true }),
    { raw: (s: string) => ({ __raw: s }) }
  ),
}))

const mockValidateBody = jest.fn()

jest.mock('@/lib/schemas', () => ({
  validateBody: (...args: unknown[]) => mockValidateBody(...args),
  BlogSubmissionSchema: {},
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const VALID_SUBMISSION = {
  name: 'Test Author',
  email: 'author@example.com',
  title: 'My Blog Post',
  content: 'This is the content of the blog post.',
  submissionType: 'article',
  category: 'tech',
  tags: ['open-source', 'tech'],
}

beforeEach(() => {
  jest.resetAllMocks()

  mockAuth.mockResolvedValue(null) // anonymous by default
  mockGetClientIp.mockReturnValue('127.0.0.1')
  mockCheckRateLimit.mockReturnValue({ allowed: true, retryAfter: 0, remaining: 10, resetAt: 0 })
  mockSendEmail.mockResolvedValue(undefined)
  mockGenerateSlug.mockReturnValue('my-blog-post')

  // Default validateBody: valid
  mockValidateBody.mockReturnValue({ success: true, data: VALID_SUBMISSION })

  // Default select for category lookup: returns category
  const mockWhereFn = jest.fn().mockResolvedValue([{ id: 'cat-1' }])
  mockFrom.mockReturnValue({ where: mockWhereFn })
  mockSelect.mockReturnValue({ from: mockFrom })

  // Default insert for blog submission
  mockReturning.mockResolvedValue([{ id: 'sub-1' }])
  mockValues.mockReturnValue({ returning: mockReturning })
})

// ============================================================================
// POST — rate limiting
// ============================================================================

describe('POST /api/public/blog/submit — rate limiting', () => {
  it('returns 429 when rate limited', async () => {
    mockCheckRateLimit.mockReturnValueOnce({ allowed: false, retryAfter: 60, remaining: 0, resetAt: 0 })
    const req = new NextRequest('http://localhost/api/public/blog/submit', {
      method: 'POST',
      body: JSON.stringify(VALID_SUBMISSION),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(429)
  })
})

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/public/blog/submit — validation', () => {
  it('returns 400 when body is invalid', async () => {
    const { NextResponse } = jest.requireActual('next/server') as typeof import('next/server')
    mockValidateBody.mockReturnValueOnce({
      success: false,
      error: NextResponse.json({ success: false, error: 'Ungültige Eingabedaten' }, { status: 400 }),
    })

    const req = new NextRequest('http://localhost/api/public/blog/submit', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }), // invalid
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(400)
  })
})

// ============================================================================
// POST — success (anonymous)
// ============================================================================

describe('POST /api/public/blog/submit — success', () => {
  it('returns 200 with submission id (anonymous)', async () => {
    // Category select: category found
    const mockWhereFn = jest.fn().mockResolvedValue([{ id: 'cat-1' }])
    mockFrom.mockReturnValue({ where: mockWhereFn })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    // Admin users select: no admins (avoids fan-out email complexity)
    const mockAdminWhere = jest.fn().mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockAdminWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/public/blog/submit', {
      method: 'POST',
      body: JSON.stringify(VALID_SUBMISSION),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.id).toBe('sub-1')
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockGenerateSlug).toHaveBeenCalledWith('My Blog Post')
  })

  it('returns 200 with submission when user is logged in', async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'author@example.com' },
      expires: '2027-01-01',
    })

    // Category select
    const mockWhereFn = jest.fn().mockResolvedValue([{ id: 'cat-1' }])
    mockFrom.mockReturnValue({ where: mockWhereFn })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    // Admin users select: no admins
    const mockAdminWhere = jest.fn().mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockAdminWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/public/blog/submit', {
      method: 'POST',
      body: JSON.stringify(VALID_SUBMISSION),
      headers: { 'Content-Type': 'application/json' },
    })
    const response = await POST(req)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('sends confirmation email to submitter', async () => {
    // Category select
    const mockWhereFn = jest.fn().mockResolvedValue([{ id: 'cat-1' }])
    mockFrom.mockReturnValue({ where: mockWhereFn })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    // Admin users select: no admins
    const mockAdminWhere = jest.fn().mockResolvedValue([])
    mockFrom.mockReturnValue({ where: mockAdminWhere })
    mockSelect.mockReturnValueOnce({ from: mockFrom })

    const req = new NextRequest('http://localhost/api/public/blog/submit', {
      method: 'POST',
      body: JSON.stringify(VALID_SUBMISSION),
      headers: { 'Content-Type': 'application/json' },
    })
    await POST(req)

    expect(mockSendEmail).toHaveBeenCalledWith(
      'author@example.com',
      'blogSubmissionReceived',
      'Test Author',
      'My Blog Post',
      'sub-1'
    )
  })
})
