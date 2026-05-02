/**
 * @jest-environment node
 *
 * Tests for GET /api/admin/blog/categories and POST /api/admin/blog/categories
 *
 * Mission-relevant: blog categories drive how content is organized and
 * browsed. If the list is wrong or slug uniqueness isn't enforced, editors
 * create duplicate or broken categories.
 *
 * Behaviors locked:
 *   GET /api/admin/blog/categories
 *   - returns 401 when not authenticated
 *   - returns 200 with categories array
 *   - returns empty array when no categories exist
 *   - returns 500 when DB throws
 *
 *   POST /api/admin/blog/categories
 *   - returns 401 when not authenticated
 *   - returns 400 when name is missing
 *   - returns 400 when slug is missing
 *   - returns 400 when slug already exists
 *   - returns 200 with created category
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

// Select chain: select().from().where() for slug check; select().from().orderBy() for list
const mockSelectWhere = jest.fn()
const mockSelectOrderBy = jest.fn()
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy })
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom })

// Insert chain: insert().values().returning()
const mockInsertReturning = jest.fn()
const mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning })
const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
    insert: (...args: unknown[]) => mockInsert.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogCategories: {
    id: 'bc_id', slug: 'bc_slug', name: 'bc_name', description: 'bc_desc',
    color: 'bc_color', sortOrder: 'bc_sortOrder', updatedAt: 'bc_updatedAt',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  asc: jest.fn().mockReturnValue({ __asc: true }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
  }
})

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MOCK_SESSION = {
  user: { id: 'admin-1', email: 'admin@revamp-it.ch', name: 'Admin', isStaff: true, staffPermissions: ['*'] as string[], isSuperAdmin: true },
  expires: '2027-01-01',
}

const MOCK_CATEGORIES = [
  { id: 'cat-1', slug: 'repair', name: 'Repair', description: null, color: '#blue', sortOrder: 0 },
  { id: 'cat-2', slug: 'software', name: 'Software', description: 'Opensource', color: '#green', sortOrder: 1 },
]

function makeGetRequest() {
  return new NextRequest('http://localhost/api/admin/blog/categories')
}

function makePostRequest(body: Record<string, unknown> = {}) {
  return new NextRequest('http://localhost/api/admin/blog/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockSelect.mockReturnValue({ from: mockSelectFrom })
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere, orderBy: mockSelectOrderBy })
  mockSelectOrderBy.mockResolvedValue(MOCK_CATEGORIES)
  mockSelectWhere.mockResolvedValue([]) // no existing slug by default

  mockInsert.mockReturnValue({ values: mockInsertValues })
  mockInsertValues.mockReturnValue({ returning: mockInsertReturning })
  mockInsertReturning.mockResolvedValue([{ id: 'cat-new', name: 'Neue', slug: 'neue', description: null, color: null, sort_order: 0 }])
})

// ============================================================================
// GET /api/admin/blog/categories
// ============================================================================

describe('GET /api/admin/blog/categories — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/blog/categories — authenticated', () => {
  it('returns 200 with category list', async () => {
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(200)
  })

  it('returns categories array', async () => {
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(2)
  })

  it('returns empty array when no categories', async () => {
    mockSelectOrderBy.mockResolvedValueOnce([])
    const response = await GET(makeGetRequest())
    const body = await response.json()
    expect(body.data).toEqual([])
  })

  it('returns 500 when DB throws', async () => {
    mockSelectOrderBy.mockRejectedValueOnce(new Error('DB error'))
    const response = await GET(makeGetRequest())
    expect(response.status).toBe(500)
  })
})

// ============================================================================
// POST /api/admin/blog/categories
// ============================================================================

describe('POST /api/admin/blog/categories — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await POST(makePostRequest({ name: 'Test', slug: 'test' }))
    expect(response.status).toBe(401)
  })
})

describe('POST /api/admin/blog/categories — validation', () => {
  it('returns 400 when name is missing', async () => {
    const response = await POST(makePostRequest({ slug: 'test' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when slug is missing', async () => {
    const response = await POST(makePostRequest({ name: 'Test' }))
    expect(response.status).toBe(400)
  })

  it('returns 400 when slug already exists', async () => {
    mockSelectWhere.mockResolvedValueOnce([{ id: 'cat-existing' }])
    const response = await POST(makePostRequest({ name: 'Test', slug: 'existing-slug' }))
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('Slug existiert bereits')
  })
})

describe('POST /api/admin/blog/categories — success', () => {
  it('returns 201 with created category', async () => {
    const response = await POST(makePostRequest({ name: 'Neue Kategorie', slug: 'neue-kategorie' }))
    expect(response.status).toBe(201)
  })

  it('returns the created category data', async () => {
    const response = await POST(makePostRequest({ name: 'Neue', slug: 'neue' }))
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.slug).toBe('neue')
  })

  it('returns 500 when insert throws', async () => {
    mockInsertReturning.mockRejectedValueOnce(new Error('constraint violation'))
    const response = await POST(makePostRequest({ name: 'Test', slug: 'test' }))
    expect(response.status).toBe(500)
  })
})
