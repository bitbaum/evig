/**
 * @jest-environment node
 *
 * Tests for GET/PATCH/DELETE /api/admin/blog/categories/[id]
 *
 * Mission-relevant: individual category CRUD. DELETE must block when posts
 * are assigned to prevent orphaned content. PATCH must enforce slug uniqueness
 * across other categories (not itself).
 *
 * Behaviors locked:
 *   GET /api/admin/blog/categories/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when category does not exist
 *   - returns 200 with category
 *
 *   PATCH /api/admin/blog/categories/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when category does not exist
 *   - returns 400 when name or slug missing
 *   - returns 400 when slug conflicts with another category
 *   - returns 200 with updated category
 *
 *   DELETE /api/admin/blog/categories/[id]
 *   - returns 401 when not authenticated
 *   - returns 404 when category does not exist
 *   - returns 400 when category has posts assigned
 *   - returns 200 with deleted: true
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

const mockSelectWhere = jest.fn()
const mockSelectFrom = jest.fn().mockReturnValue({ where: mockSelectWhere })
const mockSelect = jest.fn().mockReturnValue({ from: mockSelectFrom })

const mockUpdateReturning = jest.fn()
const mockUpdateWhere = jest.fn().mockReturnValue({ returning: mockUpdateReturning })
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere })
const mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet })

const mockDeleteWhere = jest.fn()
const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere })

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
    update: (...args: unknown[]) => mockUpdate.apply(null, args),
    delete: (...args: unknown[]) => mockDelete.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogCategories: {
    id: 'bc_id', slug: 'bc_slug', name: 'bc_name', description: 'bc_desc',
    color: 'bc_color', sortOrder: 'bc_sortOrder', updatedAt: 'bc_updatedAt',
  },
  blogPosts: {
    id: 'bp_id', categoryId: 'bp_categoryId',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  ne: jest.fn().mockReturnValue({ __ne: true }),
  sql: Object.assign(jest.fn().mockReturnValue({ __sql: 'sql' }), { raw: jest.fn() }),
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
    apiNotFound: (entity: string) =>
      NextResponse.json({ success: false, error: `${entity} nicht gefunden` }, { status: 404 }),
    apiBadRequest: (msg: string, details?: unknown) =>
      NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
  }
})

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

const MOCK_CATEGORY = {
  id: 'cat-1', slug: 'repair', name: 'Repair', description: null,
  color: '#blue', sort_order: 0,
}

function makeRequest(method = 'GET', body?: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/admin/blog/categories/cat-1', body
    ? { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : { method: method }
  )
}

function makeContext(id = 'cat-1') {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  // Use resetAllMocks to clear once-queues between tests — this route
  // calls select() multiple times (existence + conflict/count checks) and
  // stale once-values from a previous test would cause wrong responses.
  jest.resetAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)

  mockSelect.mockReturnValue({ from: mockSelectFrom })
  mockSelectFrom.mockReturnValue({ where: mockSelectWhere })
  mockUpdate.mockReturnValue({ set: mockUpdateSet })
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockReturnValue({ returning: mockUpdateReturning })
  mockDelete.mockReturnValue({ where: mockDeleteWhere })

  mockUpdateReturning.mockResolvedValue([MOCK_CATEGORY])
  mockDeleteWhere.mockResolvedValue([])
})

// ============================================================================
// GET /api/admin/blog/categories/[id]
// ============================================================================

describe('GET /api/admin/blog/categories/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('GET /api/admin/blog/categories/[id] — authenticated', () => {
  it('returns 200 with category', async () => {
    mockSelectWhere.mockResolvedValueOnce([MOCK_CATEGORY])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the category data', async () => {
    mockSelectWhere.mockResolvedValueOnce([MOCK_CATEGORY])
    const response = await GET(makeRequest(), makeContext())
    const body = await response.json()
    expect(body.data.slug).toBe('repair')
  })

  it('returns 404 when category does not exist', async () => {
    mockSelectWhere.mockResolvedValueOnce([])
    const response = await GET(makeRequest(), makeContext())
    expect(response.status).toBe(404)
  })
})

// ============================================================================
// PATCH /api/admin/blog/categories/[id]
// ============================================================================

describe('PATCH /api/admin/blog/categories/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await PATCH(makeRequest('PATCH', { name: 'New', slug: 'new' }), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('PATCH /api/admin/blog/categories/[id] — validation', () => {
  it('returns 404 when category does not exist', async () => {
    mockSelectWhere.mockResolvedValueOnce([])
    const response = await PATCH(makeRequest('PATCH', { name: 'New', slug: 'new' }), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when name is missing', async () => {
    mockSelectWhere.mockResolvedValueOnce([MOCK_CATEGORY])
    const response = await PATCH(makeRequest('PATCH', { slug: 'repair' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when slug is missing', async () => {
    mockSelectWhere.mockResolvedValueOnce([MOCK_CATEGORY])
    const response = await PATCH(makeRequest('PATCH', { name: 'Repair' }), makeContext())
    expect(response.status).toBe(400)
  })

  it('returns 400 when slug conflicts with another category', async () => {
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY])     // existence check
      .mockResolvedValueOnce([{ id: 'cat-other' }]) // slug conflict
    const response = await PATCH(makeRequest('PATCH', { name: 'Other', slug: 'software' }), makeContext())
    expect(response.status).toBe(400)
  })
})

describe('PATCH /api/admin/blog/categories/[id] — success', () => {
  it('returns 200 with updated category', async () => {
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY]) // existence
      .mockResolvedValueOnce([])              // no slug conflict
    const response = await PATCH(makeRequest('PATCH', { name: 'Repair Updated', slug: 'repair' }), makeContext())
    expect(response.status).toBe(200)
  })

  it('returns the updated data', async () => {
    const updated = { ...MOCK_CATEGORY, name: 'Repair Updated' }
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY])
      .mockResolvedValueOnce([])
    mockUpdateReturning.mockResolvedValueOnce([updated])
    const response = await PATCH(makeRequest('PATCH', { name: 'Repair Updated', slug: 'repair' }), makeContext())
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe('Repair Updated')
  })
})

// ============================================================================
// DELETE /api/admin/blog/categories/[id]
// ============================================================================

describe('DELETE /api/admin/blog/categories/[id] — unauthenticated', () => {
  it('returns 401 when session is null', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(401)
  })
})

describe('DELETE /api/admin/blog/categories/[id] — validation', () => {
  it('returns 404 when category does not exist', async () => {
    mockSelectWhere.mockResolvedValueOnce([])
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(404)
  })

  it('returns 400 when category has posts', async () => {
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY])  // existence
      .mockResolvedValueOnce([{ count: 3 }])   // post count
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('gelöscht werden')
  })
})

describe('DELETE /api/admin/blog/categories/[id] — success', () => {
  it('returns 200 with deleted: true', async () => {
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY])  // existence
      .mockResolvedValueOnce([{ count: 0 }])   // no posts
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.deleted).toBe(true)
  })

  it('returns 500 when DB throws', async () => {
    mockSelectWhere
      .mockResolvedValueOnce([MOCK_CATEGORY])
      .mockResolvedValueOnce([{ count: 0 }])
    mockDeleteWhere.mockRejectedValueOnce(new Error('FK constraint'))
    const response = await DELETE(makeRequest('DELETE'), makeContext())
    expect(response.status).toBe(500)
  })
})
