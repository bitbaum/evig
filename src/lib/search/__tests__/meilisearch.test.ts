/**
 * Tests for search/meilisearch.ts — Meilisearch listing integration.
 *
 * Mission-relevant: Meilisearch is the search layer for the P2P marketplace.
 * If filter construction is wrong (missing status filter, malformed price range),
 * users see inactive listings or miss relevant results.
 *
 * Behaviors locked:
 *   isMeilisearchAvailable
 *   - returns true when /health responds ok
 *   - returns false when /health returns non-ok
 *   - returns false on network error
 *
 *   indexListing
 *   - sends POST to /indexes/listings/documents with listing as array body
 *   - never throws (swallows fetch errors via logger.warn)
 *
 *   removeListing
 *   - sends DELETE to /indexes/listings/documents/:id
 *   - never throws (swallows fetch errors)
 *
 *   searchListings
 *   - always includes `status = "active"` in filter
 *   - appends category filter when provided
 *   - appends price_min / price_max filters
 *   - appends seller_type filters for revampit and community
 *   - maps sort options: price_asc, price_desc, popular, default → created_at:desc
 *   - returns null when HTTP response is not ok
 *   - returns null on network error
 *   - returns SearchResult on success
 */

// ---------------------------------------------------------------------------
// fetch mock — save/restore to prevent global leak
// ---------------------------------------------------------------------------

const originalFetch = global.fetch
const mockFetch = jest.fn()

beforeAll(() => { global.fetch = mockFetch })
afterAll(() => { global.fetch = originalFetch })

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/urls', () => ({
  MEILISEARCH_URL: 'http://meilisearch.test',
}))

jest.mock('@/config/marketplace', () => ({
  MARKETPLACE_SELLER_TYPE: {
    REVAMPIT: 'revampit',
    COMMUNITY: 'community',
  },
  LISTING_STATUS: {
    ACTIVE: 'active',
  },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  isMeilisearchAvailable,
  indexListing,
  removeListing,
  searchListings,
  type MeilisearchDocument,
} from '../meilisearch'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function okResponse(body: unknown = {}) {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(body),
  }
}

function errResponse(status: number) {
  return {
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({}),
  }
}

function makeListing(overrides: Partial<MeilisearchDocument> = {}): MeilisearchDocument {
  return {
    id: 'listing-1',
    title: 'ThinkPad T480',
    description: 'Gut erhaltenes Laptop',
    brand: 'Lenovo',
    model: 'T480',
    category: 'laptop',
    condition: 'good',
    price_chf: 199,
    delivery_options: 'pickup',
    payment_mode: 'cash',
    status: 'active',
    is_revampit: false,
    is_verified: false,
    pickup_location: 'Bern',
    seller_name: 'Hans',
    seller_city: 'Bern',
    view_count: 0,
    favorite_count: 0,
    created_at: '2026-04-01T00:00:00Z',
    thumbnail: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// isMeilisearchAvailable
// ============================================================================

describe('isMeilisearchAvailable', () => {
  it('returns true when /health responds ok', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    const result = await isMeilisearchAvailable()

    expect(result).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('/health')
  })

  it('returns false when /health is not ok', async () => {
    mockFetch.mockResolvedValueOnce(errResponse(503))

    const result = await isMeilisearchAvailable()

    expect(result).toBe(false)
  })

  it('returns false on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connection refused'))

    const result = await isMeilisearchAvailable()

    expect(result).toBe(false)
  })
})

// ============================================================================
// indexListing
// ============================================================================

describe('indexListing', () => {
  it('sends POST to /indexes/listings/documents with listing as array', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    const listing = makeListing()
    await indexListing(listing)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/indexes/listings/documents')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(Array.isArray(body)).toBe(true)
    expect(body[0].id).toBe('listing-1')
  })

  it('sends to the configured Meilisearch host URL', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    await indexListing(makeListing())

    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('meilisearch.test')
  })

  it('does not throw when fetch fails (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network error'))

    // Should not throw — error is swallowed
    await expect(indexListing(makeListing())).resolves.toBeUndefined()
  })

  it('does not throw when Meilisearch returns 4xx (no retry, still swallowed)', async () => {
    // 4xx doesn't retry (status < 500) but meiliWriteWithRetry returns the response;
    // indexListing doesn't inspect the response and returns void
    mockFetch.mockResolvedValueOnce(errResponse(422))

    await expect(indexListing(makeListing())).resolves.toBeUndefined()
  })
})

// ============================================================================
// removeListing
// ============================================================================

describe('removeListing', () => {
  it('sends DELETE to /indexes/listings/documents/:id', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())

    await removeListing('listing-1')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/indexes/listings/documents/listing-1')
    expect(options.method).toBe('DELETE')
  })

  it('does not throw when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'))

    await expect(removeListing('listing-1')).resolves.toBeUndefined()
  })
})

// ============================================================================
// searchListings — filter construction
// ============================================================================

describe('searchListings — filter construction', () => {
  function captureBody() {
    const [, options] = mockFetch.mock.calls[0]
    return JSON.parse(options.body)
  }

  it('always includes status = "active" in filter', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', {}, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('status = "active"')
  })

  it('appends category filter when provided', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', { category: 'laptop' }, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('category = "laptop"')
  })

  it('appends price_min and price_max filters', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', { price_min: 50, price_max: 300 }, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('price_chf >= 50')
    expect(body.filter).toContain('price_chf <= 300')
  })

  it('appends is_revampit = true for revampit seller_type', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', { seller_type: 'revampit' }, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('is_revampit = true')
  })

  it('appends is_revampit = false for community seller_type', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', { seller_type: 'community' }, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('is_revampit = false')
  })

  it('appends is_verified = true for verified_only filter', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', { verified_only: true }, 'newest', 1, 20)

    const body = captureBody()
    expect(body.filter).toContain('is_verified = true')
  })
})

// ============================================================================
// searchListings — sort mapping
// ============================================================================

describe('searchListings — sort mapping', () => {
  function captureBody() {
    const [, options] = mockFetch.mock.calls[0]
    return JSON.parse(options.body)
  }

  it.each([
    ['price_asc', 'price_chf:asc'],
    ['price_desc', 'price_chf:desc'],
    ['popular', 'view_count:desc'],
    ['newest', 'created_at:desc'],
    ['unknown', 'created_at:desc'],
  ])('maps sort "%s" to "%s"', async (sort, expected) => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', {}, sort, 1, 20)

    const body = captureBody()
    expect(body.sort).toContain(expected)
  })
})

// ============================================================================
// searchListings — HTTP behavior
// ============================================================================

describe('searchListings — HTTP behavior', () => {
  it('returns SearchResult on success', async () => {
    const searchResult = {
      hits: [makeListing()],
      estimatedTotalHits: 1,
      facetDistribution: {},
    }
    mockFetch.mockResolvedValueOnce(okResponse(searchResult))

    const result = await searchListings('ThinkPad', {}, 'newest', 1, 20)

    expect(result).not.toBeNull()
    expect(result?.hits).toHaveLength(1)
    expect(result?.estimatedTotalHits).toBe(1)
  })

  it('returns null when HTTP response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(errResponse(503))

    const result = await searchListings('', {}, 'newest', 1, 20)

    expect(result).toBeNull()
  })

  it('returns null on network error (never throws)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connection refused'))

    const result = await searchListings('', {}, 'newest', 1, 20)

    expect(result).toBeNull()
  })

  it('sends pagination offset correctly', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({ hits: [], estimatedTotalHits: 0 }))

    await searchListings('', {}, 'newest', 3, 10) // page 3, limit 10 → offset 20

    const [, options] = mockFetch.mock.calls[0]
    const body = JSON.parse(options.body)
    expect(body.offset).toBe(20)
    expect(body.limit).toBe(10)
  })
})
