/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/blog/[id]
 *
 * Mission-relevant: admin-only CRUD for blog posts. PATCH makes two sequential
 * selects (existence + slug conflict) so each test configures mockResolvedValueOnce
 * chains explicitly to avoid bleed-over.
 *
 * Behaviors locked:
 *   GET /api/admin/blog/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when post not found
 *   - returns 200 with post
 *
 *   PATCH /api/admin/blog/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when post not found
 *   - returns 400 when slug already exists
 *   - returns 200 on success
 *
 *   DELETE /api/admin/blog/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when post not found
 *   - returns 200 on success
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

const mockSelect = jest.fn()
const mockFrom = jest.fn()
const mockLeftJoin = jest.fn()
const mockWhere = jest.fn()
const mockUpdate = jest.fn()
const mockSet = jest.fn()
const mockUpdateWhere = jest.fn()
const mockDelete = jest.fn()
const mockDeleteWhere = jest.fn()
const mockDeleteReturning = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => { mockSelect(...args); return { from: mockFrom } },
    update: (...args: unknown[]) => { mockUpdate(...args); return { set: mockSet } },
    delete: (...args: unknown[]) => { mockDelete(...args); return { where: mockDeleteWhere } },
  },
}))

jest.mock('@/db/schema', () => ({
  blogPosts: { id: 'bp_id', slug: 'bp_slug', title: 'bp_title', excerpt: 'bp_excerpt', content: 'bp_content', featuredImage: 'bp_featuredImage', categoryId: 'bp_categoryId', tags: 'bp_tags', isPublished: 'bp_isPublished', publishedAt: 'bp_publishedAt', seoTitle: 'bp_seoTitle', seoDescription: 'bp_seoDescription', createdAt: 'bp_createdAt', updatedAt: 'bp_updatedAt' },
  blogCategories: { id: 'bc_id', name: 'bc_name' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  ne: jest.fn().mockReturnValue({ __ne: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'NOW()' }), { raw: jest.fn(), join: jest.fn() }),
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

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_POST = {
  id: 'post-1',
  slug: 'mein-artikel',
  title: 'Mein Artikel',
  excerpt: 'Kurze Beschreibung',
  content: '<p>Inhalt</p>',
  featured_image: null,
  category_id: 'cat-1',
  category_name: 'Allgemein',
  tags: ['tech'],
  is_published: false,
  published_at: null,
  seo_title: null,
  seo_description: null,
  created_at: '2026-01-01',
  updated_at: '2026-05-01',
}

const MOCK_EXISTING = {
  id: 'post-1',
  isPublished: false,
  publishedAt: null,
}

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  const opts: RequestInit = { method }
  if (body) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }
  return new NextRequest('http://localhost/api/admin/blog/post-1', opts)
}

function makeContext(id = 'post-1') {
  return { params: Promise.resolve({ id }) }
}

function setupChains() {
  // Both GET (leftJoin path) and PATCH (direct where path) use mockFrom
  mockFrom.mockReturnValue({ where: mockWhere, leftJoin: mockLeftJoin })
  mockLeftJoin.mockReturnValue({ where: mockWhere })
  mockSet.mockReturnValue({ where: mockUpdateWhere })
  mockDeleteWhere.mockReturnValue({ returning: mockDeleteReturning })
}

beforeEach(() => {
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  setupChains()
  mockWhere.mockResolvedValue([MOCK_POST])
  mockUpdateWhere.mockResolvedValue(undefined)
  mockDeleteReturning.mockResolvedValue([{ id: 'post-1' }])
})

// ============================================================================
// GET /api/admin/blog/[id]
// ============================================================================

describe('GET /api/admin/blog/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/blog/[id] — authenticated', () => {
  it('returns 200 with post', async () => {
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the post data', async () => {
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.title).toBe('Mein Artikel')
  })

  it('returns 404 when post not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// PATCH /api/admin/blog/[id]
// ============================================================================

describe('PATCH /api/admin/blog/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { title: 'Neuer Titel' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/blog/[id] — service errors', () => {
  it('returns 404 when post not found', async () => {
    mockWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { title: 'Neuer Titel' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when slug already exists', async () => {
    mockWhere
      .mockResolvedValueOnce([MOCK_EXISTING])  // existence check
      .mockResolvedValueOnce([{ id: 'post-2' }])  // slug conflict
    const response = await PATCH(makeRequest('PATCH', { slug: 'existing-slug' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/blog/[id] — success', () => {
  it('returns 200 on success', async () => {
    mockWhere
      .mockResolvedValueOnce([MOCK_EXISTING])  // existence check
      .mockResolvedValueOnce([])               // no slug conflict
    const response = await PATCH(makeRequest('PATCH', { title: 'Neuer Titel', slug: 'neuer-slug' }), makeContext())
    expect(response.status).toBe(200)
  })
})

// ============================================================================
// DELETE /api/admin/blog/[id]
// ============================================================================

describe('DELETE /api/admin/blog/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/blog/[id] — service errors', () => {
  it('returns 404 when post not found', async () => {
    mockDeleteReturning.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })
})

describe('DELETE /api/admin/blog/[id] — success', () => {
  it('returns 200 on success', async () => {
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns 500 when DB throws', async () => {
    mockDeleteReturning.mockRejectedValueOnce(new Error('DB error'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})
