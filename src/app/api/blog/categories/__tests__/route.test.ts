/**
 * @jest-environment node
 *
 * Tests for GET /api/blog/categories
 *
 * Mission-relevant: blog category selection appears in the blog submission
 * form. If categories return empty, submitters can't categorize their posts
 * and the blog workflow stalls.
 *
 * Behaviors locked:
 *   GET /api/blog/categories
 *   - returns 200 with array of categories
 *   - includes id, slug, name, description, color fields
 *   - returns empty array when no categories exist
 *   - returns error response when DB query throws
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOrderBy = jest.fn()
const mockFrom = jest.fn(() => ({ orderBy: mockOrderBy }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogCategories: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    description: 'description',
    color: 'color',
    sortOrder: 'sort_order',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  asc: jest.fn((col) => ({ __asc: col })),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => ({
  apiSuccessCached: (data: unknown) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: true, data })
  },
  apiError: (err: unknown, msg: string) => {
    const { NextResponse } = jest.requireActual('next/server')
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { GET } from '../route'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_CATEGORIES = [
  { id: 'cat-1', slug: 'allgemein', name: 'Allgemein', description: 'Allgemeine Beiträge', color: '#6B7280' },
  { id: 'cat-2', slug: 'nachhaltigkeit', name: 'Nachhaltigkeit', description: 'Grüne IT', color: '#10B981' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFrom.mockReturnValue({ orderBy: mockOrderBy })
  mockSelect.mockReturnValue({ from: mockFrom })
  mockOrderBy.mockResolvedValue(SAMPLE_CATEGORIES)
})

// ============================================================================
// GET /api/blog/categories
// ============================================================================

describe('GET /api/blog/categories', () => {
  it('returns 200 status', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
  })

  it('returns success: true', async () => {
    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(true)
  })

  it('returns array of categories', async () => {
    const response = await GET()
    const body = await response.json()
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
  })

  it('includes expected category fields', async () => {
    const response = await GET()
    const body = await response.json()
    const cat = body.data[0]
    expect(cat.id).toBe('cat-1')
    expect(cat.slug).toBe('allgemein')
    expect(cat.name).toBe('Allgemein')
    expect(cat.description).toBeTruthy()
    expect(cat.color).toBeTruthy()
  })

  it('returns empty array when no categories exist', async () => {
    mockOrderBy.mockResolvedValueOnce([])

    const response = await GET()
    const body = await response.json()
    expect(body.data).toEqual([])
  })

  it('returns error response when DB query throws', async () => {
    mockOrderBy.mockRejectedValueOnce(new Error('DB error'))

    const response = await GET()
    const body = await response.json()
    expect(body.success).toBe(false)
    expect(response.status).toBe(500)
  })
})
