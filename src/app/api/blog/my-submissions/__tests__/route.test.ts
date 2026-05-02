/**
 * @jest-environment node
 *
 * Tests for GET /api/blog/my-submissions
 *
 * Mission-relevant: submitters track their blog post status in their dashboard.
 * This route enriches raw DB rows with human-readable labels and next-action
 * guidance. If those enrichments are wrong, submitters get confusing feedback
 * about where their post is in the review pipeline.
 *
 * Behaviors locked:
 *   GET /api/blog/my-submissions
 *   - returns 401 when not authenticated
 *   - returns 200 with enriched submissions array
 *   - adds statusLabel from getApprovalStatusLabel
 *   - adds nextAction guidance for each status
 *   - returns empty array when user has no submissions
 *   - queries only the current user's submissions
 *   - returns 500 when DB throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

// Drizzle chain: select().from().leftJoin().where().orderBy()
const mockOrderBy = jest.fn()
const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy })
const mockLeftJoin = jest.fn().mockReturnValue({ where: mockWhere })
const mockFrom = jest.fn().mockReturnValue({ leftJoin: mockLeftJoin })
const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogSubmissions: {
    id: 'bs_id', userId: 'bs_userId', title: 'bs_title', slug: 'bs_slug',
    status: 'bs_status', submissionType: 'bs_type', reviewNotes: 'bs_notes',
    rejectionReason: 'bs_rejection', publishedPostId: 'bs_postId',
    publishedAt: 'bs_publishedAt', submittedAt: 'bs_submittedAt',
    createdAt: 'bs_createdAt', updatedAt: 'bs_updatedAt',
  },
  blogPosts: { id: 'bp_id', slug: 'bp_slug' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
}))

jest.mock('@/config/approval-status', () => ({
  APPROVAL_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    PUBLISHED: 'published',
    REJECTED: 'rejected',
    REQUIRES_CHANGES: 'requires_changes',
  },
  getApprovalStatusLabel: jest.fn((status: string) => `Label: ${status}`),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccess: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string, status = 500) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status })
  },
  apiUnauthorized: (msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 401 })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'user-blog', email: 'writer@example.com', name: 'Writer', isStaff: false, staffPermissions: [] as string[], isSuperAdmin: false },
  expires: '2027-01-01',
}

const DB_ROWS = [
  {
    id: 'sub-1', title: 'Mein erster Post', slug: null, status: 'pending',
    submissionType: 'community', reviewNotes: null, rejectionReason: null,
    publishedPostId: null, publishedPostSlug: null, publishedAt: null,
    submittedAt: '2026-05-01', createdAt: '2026-05-01', updatedAt: '2026-05-01',
  },
  {
    id: 'sub-2', title: 'Open Source Vortrag', slug: 'open-source-vortrag', status: 'published',
    submissionType: 'community', reviewNotes: 'Gut geschrieben', rejectionReason: null,
    publishedPostId: 'post-1', publishedPostSlug: 'open-source-vortrag', publishedAt: '2026-04-15',
    submittedAt: '2026-04-10', createdAt: '2026-04-10', updatedAt: '2026-04-15',
  },
]

function makeRequest() {
  return new NextRequest('http://localhost/api/blog/my-submissions')
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockSelect.mockReturnValue({ from: mockFrom })
  mockFrom.mockReturnValue({ leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockWhere.mockReturnValue({ orderBy: mockOrderBy })
  mockOrderBy.mockResolvedValue(DB_ROWS)
})

// ============================================================================
// GET /api/blog/my-submissions
// ============================================================================

describe('GET /api/blog/my-submissions — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/blog/my-submissions — authenticated', () => {
  it('returns 200 on success', async () => {
    const response = await GET(makeRequest())
    expect(response.status).toBe(200)
  })

  it('returns submissions array', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions).toHaveLength(2)
  })

  it('adds statusLabel to each submission', async () => {
    const { getApprovalStatusLabel } = await import('@/config/approval-status')
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions[0].statusLabel).toBe('Label: pending')
    expect(getApprovalStatusLabel).toHaveBeenCalledWith('pending')
  })

  it('adds nextAction guidance for pending status', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()
    const pendingSub = body.data.submissions.find((s: { status: string }) => s.status === 'pending')
    expect(pendingSub.nextAction).toBeTruthy()
    expect(typeof pendingSub.nextAction).toBe('string')
  })

  it('returns null nextAction for unknown status', async () => {
    mockOrderBy.mockResolvedValueOnce([
      { ...DB_ROWS[0], status: 'unknown-status' },
    ])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions[0].nextAction).toBeNull()
  })

  it('populates adminFeedback from rejectionReason when present', async () => {
    mockOrderBy.mockResolvedValueOnce([
      { ...DB_ROWS[0], status: 'rejected', rejectionReason: 'Off-topic content' },
    ])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions[0].adminFeedback).toBe('Off-topic content')
  })

  it('falls back to reviewNotes for adminFeedback when rejectionReason is null', async () => {
    mockOrderBy.mockResolvedValueOnce([
      { ...DB_ROWS[0], rejectionReason: null, reviewNotes: 'Needs more detail' },
    ])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions[0].adminFeedback).toBe('Needs more detail')
  })

  it('returns empty array when user has no submissions', async () => {
    mockOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeRequest())
    const body = await response.json()
    expect(body.data.submissions).toEqual([])
  })

  it('queries by current user id', async () => {
    await GET(makeRequest())
    const { eq } = await import('drizzle-orm')
    expect(eq).toHaveBeenCalledWith(expect.anything(), 'user-blog')
  })

  it('returns 500 when DB throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('DB timeout'))
    const response = await GET(makeRequest())
    expect(response.status).toBe(500)
  })
})
