/**
 * Tests for lib/blog-db.ts — blog post and category database reads.
 *
 * Mission-relevant: the blog communicates Revamp-IT's mission to donors and
 * community members. If getAllPosts returns an empty array due to a swallowed
 * error, staff won't know the blog is broken. mapPostFromDb field defaults
 * (null author → 'Revamp-IT Team', null tags → []) must be stable.
 *
 * Behaviors locked:
 *   getAllPosts
 *   - returns mapped posts from DB
 *   - returns empty array on DB error (never throws)
 *
 *   getPostBySlug
 *   - returns null when no matching post
 *   - returns mapped post when found
 *   - returns null on DB error
 *
 *   getAllCategories
 *   - returns mapped categories
 *   - returns empty array on DB error
 *
 *   getPostsByCategory
 *   - returns posts filtered by category name
 *   - returns empty array on DB error
 *
 *   mapPostFromDb (via all above)
 *   - falls back to 'Revamp-IT Team' when authorName is null
 *   - falls back to [] when tags is null
 *   - always sets published: true
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.leftJoin = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema/content', () => ({
  blogPosts: {
    id: 'bp_id', slug: 'bp_slug', title: 'bp_title', excerpt: 'bp_excerpt',
    content: 'bp_content', featuredImage: 'bp_featuredImage',
    categoryId: 'bp_categoryId', createdBy: 'bp_createdBy',
    tags: 'bp_tags', publishedAt: 'bp_publishedAt', createdAt: 'bp_createdAt',
    isPublished: 'bp_isPublished', visibility: 'bp_visibility',
    seoTitle: 'bp_seoTitle', seoDescription: 'bp_seoDescription',
  },
  blogCategories: {
    id: 'bc_id', slug: 'bc_slug', name: 'bc_name',
    description: 'bc_description', color: 'bc_color',
  },
  blogHiddenSlugs: { slug: 'bh_slug' },
  blogPostTranslations: {
    postId: 'bt_postId', locale: 'bt_locale', title: 'bt_title',
    excerpt: 'bt_excerpt', content: 'bt_content',
    seoTitle: 'bt_seoTitle', seoDescription: 'bt_seoDescription',
    isMachine: 'bt_isMachine',
  },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { name: 'u_name', id: 'u_id' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  lte: jest.fn().mockReturnValue({ __lte: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  asc: jest.fn().mockReturnValue({ __asc: true }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/blog', () => ({}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getAllPosts, getPostBySlug, getAllCategories, getPostsByCategory } from '../blog-db'
import { DEFAULT_BLOG_AUTHOR } from '@/config/org'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePostRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: 'geraet-reparatur',
    title: 'Gerät repariert statt weggeworfen',
    excerpt: 'Kurze Zusammenfassung',
    content: '<p>Inhalt</p>',
    featuredImage: '/images/repair.jpg',
    authorName: 'Andreas Bärtsch',
    categoryName: 'Nachhaltigkeit',
    tags: ['reparatur', 'umwelt'],
    publishedAt: '2026-04-01T12:00:00Z',
    createdAt: '2026-03-28T08:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
})

// ============================================================================
// getAllPosts
// ============================================================================

describe('getAllPosts', () => {
  it('returns mapped posts from DB', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow()]))

    const posts = await getAllPosts()

    expect(posts).toHaveLength(1)
    expect(posts[0].slug).toBe('geraet-reparatur')
    expect(posts[0].title).toBe('Gerät repariert statt weggeworfen')
    expect(posts[0].published).toBe(true)
  })

  it('returns empty array when no posts', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    const posts = await getAllPosts()

    expect(posts).toEqual([])
  })

  it('returns empty array on DB error (never throws)', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('DB connection failed')
    })

    const posts = await getAllPosts()

    expect(posts).toEqual([])
  })
})

// ============================================================================
// getPostBySlug
// ============================================================================

describe('getPostBySlug', () => {
  it('returns mapped post when found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow()]))

    const post = await getPostBySlug('geraet-reparatur')

    expect(post).not.toBeNull()
    expect(post!.slug).toBe('geraet-reparatur')
  })

  it('returns null when no post matches', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    const post = await getPostBySlug('not-found')

    expect(post).toBeNull()
  })

  it('returns null on DB error', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('timeout')
    })

    const post = await getPostBySlug('any-slug')

    expect(post).toBeNull()
  })
})

// ============================================================================
// getAllCategories
// ============================================================================

describe('getAllCategories', () => {
  it('returns mapped categories', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([
        { id: 'cat-1', slug: 'nachhaltigkeit', name: 'Nachhaltigkeit', description: 'Grün', color: '#00aa00' },
      ])
    )

    const categories = await getAllCategories()

    expect(categories).toHaveLength(1)
    expect(categories[0].slug).toBe('nachhaltigkeit')
    expect(categories[0].isActive).toBe(true)
  })

  it('returns empty array on DB error', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('DB unavailable')
    })

    const cats = await getAllCategories()

    expect(cats).toEqual([])
  })
})

// ============================================================================
// getPostsByCategory
// ============================================================================

describe('getPostsByCategory', () => {
  it('returns posts matching category name', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([makePostRow({ categoryName: 'Nachhaltigkeit' })])
    )

    const posts = await getPostsByCategory('Nachhaltigkeit')

    expect(posts).toHaveLength(1)
    expect(posts[0].category).toBe('Nachhaltigkeit')
  })

  it('returns empty array on DB error', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      throw new Error('query failed')
    })

    const posts = await getPostsByCategory('Test')

    expect(posts).toEqual([])
  })
})

// ============================================================================
// mapPostFromDb defaults (tested via getAllPosts)
// ============================================================================

describe('mapPostFromDb field defaults', () => {
  it('falls back to the default blog author when authorName is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow({ authorName: null })]))

    const [post] = await getAllPosts()

    expect(post.author).toBe(DEFAULT_BLOG_AUTHOR)
  })

  it('falls back to empty array when tags is null', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow({ tags: null })]))

    const [post] = await getAllPosts()

    expect(post.tags).toEqual([])
  })

  it('always sets published: true', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow()]))

    const [post] = await getAllPosts()

    expect(post.published).toBe(true)
  })

  it('uses undefined for optional fields when null in DB', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([makePostRow({ excerpt: null, featuredImage: null, categoryName: null })]))

    const [post] = await getAllPosts()

    expect(post.excerpt).toBeUndefined()
    expect(post.featuredImage).toBeUndefined()
    expect(post.category).toBeUndefined()
  })
})
