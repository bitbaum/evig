/**
 * Tests for useMarketplaceListings — the public marketplace browse hook.
 *
 * Mission-critical: every customer browsing the marketplace flows
 * through this. A regression here either breaks the buyer-discovery
 * funnel or sends bogus filters to the listings API.
 *
 * The hook fetches via useSwrFetch (SWR), so each test renders inside an
 * SWRConfig with a FRESH cache and dedupe disabled — otherwise SWR's
 * module-level cache leaks data between tests and fetch-count assertions lie.
 *
 * Behaviors locked:
 *   - priceError derives from priceMin/priceMax: negative, min>max,
 *     max-50000 boundaries; clears itself when the range becomes valid
 *   - invalid price bounds are NOT sent to the API
 *   - fetch URL construction (only-truthy filters, booleans → "true",
 *     limit/offset always set)
 *   - 300ms debounced search fires + typing resets pagination offset to 0
 *   - handleSearch preventDefault + reset offset (term applies via debounce)
 *   - clearFilters resets EVERY filter dimension
 *   - hasActiveFilters is true iff any filter dimension is set
 *   - Pagination math: totalPages = ceil(total/limit),
 *     currentPage = floor(offset/limit) + 1
 *   - goToPage maps page-1-indexed → offset
 *   - Failure: error state populated, listings empty
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('@/config/marketplace', () => ({
  MARKETPLACE_LIMITS: { DEFAULT_PAGE_SIZE: 20 },
}))

import type { ReactNode } from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import { useMarketplaceListings } from '../useMarketplaceListings'

// Fresh SWR cache per render — no cross-test cache leaks, no dedupe window.
const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, revalidateOnFocus: false }}>
    {children}
  </SWRConfig>
)

const renderListings = (initial?: Parameters<typeof useMarketplaceListings>[0]) =>
  renderHook(() => useMarketplaceListings(initial), { wrapper })

const okResponse = (overrides?: { items?: unknown[]; pagination?: unknown }) => ({
  success: true,
  data: {
    items: overrides?.items ?? [],
    pagination: overrides?.pagination ?? { total: 0, limit: 20, offset: 0 },
  },
})

const lastUrl = () => mockApiFetch.mock.calls[mockApiFetch.mock.calls.length - 1][0] as string

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useMarketplaceListings — initial state', () => {
  it('starts with empty filters and DEFAULT_PAGE_SIZE pagination', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()

    expect(result.current.pagination).toEqual({ total: 0, limit: 20, offset: 0 })
    expect(result.current.filters.category).toBe('')
    expect(result.current.filters.sort).toBe('newest')
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('triggers initial fetch on mount', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    renderListings()

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain('/api/listings')
    expect(url).toContain('limit=20')
    expect(url).toContain('offset=0')
    expect(url).toContain('sort=newest') // default sort
  })
})

// ============================================================================
// priceError — derived validation
// ============================================================================

describe('priceError (derived)', () => {
  beforeEach(() => {
    mockApiFetch.mockResolvedValue(okResponse())
  })

  it('valid range → no error, prices sent to the API', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('100')
      result.current.filters.setPriceMax('500')
    })

    expect(result.current.filters.priceError).toBeNull()
    await waitFor(() => {
      expect(lastUrl()).toContain('price_min=100')
      expect(lastUrl()).toContain('price_max=500')
    })
  })

  it('negative min → error "Preis kann nicht negativ sein"', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('-50')
    })

    expect(result.current.filters.priceError).toBe('Preis kann nicht negativ sein')
  })

  it('min > max → "Mindestpreis darf nicht höher als Höchstpreis sein" (proper umlaut)', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('500')
      result.current.filters.setPriceMax('100')
    })

    expect(result.current.filters.priceError).toContain('höher')
    expect(result.current.filters.priceError).not.toContain('hoeher')
  })

  it('min > 50000 → "Preis darf maximal CHF 50\'000 sein"', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('60000')
    })

    expect(result.current.filters.priceError).toContain('50')
  })

  it('invalid bounds are NOT sent to the API', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('500')
      result.current.filters.setPriceMax('100')
    })

    await waitFor(() => {
      expect(lastUrl()).not.toContain('price_min')
      expect(lastUrl()).not.toContain('price_max')
    })
  })

  it('clears previous error when range becomes valid', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setPriceMin('-50')
    })
    expect(result.current.filters.priceError).not.toBeNull()

    act(() => {
      result.current.filters.setPriceMin('100')
    })
    expect(result.current.filters.priceError).toBeNull()
  })
})

// ============================================================================
// URL construction
// ============================================================================

describe('fetch — URL construction', () => {
  it('always sets limit and offset', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    renderListings()

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toMatch(/limit=20/)
    expect(url).toMatch(/offset=0/)
  })

  it('only-truthy string filters become query params', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setCategory('laptop')
      result.current.filters.setCondition('good')
      result.current.filters.setPriceMin('100')
    })

    await waitFor(() => {
      expect(lastUrl()).toContain('category=laptop')
      expect(lastUrl()).toContain('condition=good')
      expect(lastUrl()).toContain('price_min=100')
    })
  })

  it('booleans → "true" string when set', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setGratisOnly(true)
      result.current.filters.setVerifiedOnly(true)
    })

    await waitFor(() => {
      expect(lastUrl()).toContain('gratis_only=true')
      expect(lastUrl()).toContain('verified_only=true')
    })
  })

  it('false booleans omit the param entirely', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    renderListings()

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).not.toContain('gratis_only')
    expect(url).not.toContain('verified_only')
  })

  it('spec filters use snake_case API param names', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setSpecRamMin('16')
      result.current.filters.setSpecStorageMin('512')
      result.current.filters.setSpecDisplayMin('14')
    })

    await waitFor(() => {
      expect(lastUrl()).toContain('spec_ram_min=16')
      expect(lastUrl()).toContain('spec_storage_min=512')
      expect(lastUrl()).toContain('spec_display_min=14')
    })
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('fetch — failure', () => {
  it('failure populates error and leaves listings empty', async () => {
    mockApiFetch.mockResolvedValue({ success: false, error: 'Server down' })

    const { result } = renderListings()

    await waitFor(() => expect(result.current.error).toBe('Server down'))
    expect(result.current.listings).toEqual([])
  })

  it('thrown non-Error caught with German fallback "Ein unerwarteter Fehler ist aufgetreten"', async () => {
    mockApiFetch.mockRejectedValue('weird non-Error throw')

    const { result } = renderListings()

    await waitFor(() =>
      expect(result.current.error).toBe('Ein unerwarteter Fehler ist aufgetreten'),
    )
  })

  it('German fallback "Anfrage fehlgeschlagen" when result.error missing', async () => {
    mockApiFetch.mockResolvedValue({ success: false })

    const { result } = renderListings()

    await waitFor(() => expect(result.current.error).toBe('Anfrage fehlgeschlagen'))
  })
})

// ============================================================================
// Debounced search
// ============================================================================

describe('debounced search', () => {
  it('searchInput typing does NOT fire fetch immediately (waits for 300ms debounce)', async () => {
    jest.useFakeTimers()
    mockApiFetch.mockResolvedValue(okResponse())

    const { result } = renderListings()

    // Wait for the initial mount-fetch to settle (only the first call)
    await act(async () => {
      jest.advanceTimersByTime(0)
    })

    const initialCalls = mockApiFetch.mock.calls.length

    act(() => {
      result.current.filters.setSearchInput('macbook')
    })

    // Right after typing — the search term itself is not applied yet (debounce)
    expect(
      mockApiFetch.mock.calls.some(call => (call[0] as string).includes('search=macbook')),
    ).toBe(false)

    // After 300ms debounce — search applied, new fetch fires
    await act(async () => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(mockApiFetch.mock.calls.length).toBeGreaterThan(initialCalls)
      expect(lastUrl()).toContain('search=macbook')
    })

    jest.useRealTimers()
  })
})

// ============================================================================
// handleSearch — submit resets paging, term applies via debounce
// ============================================================================

describe('handleSearch', () => {
  it('preventDefault on submit; term applies via the 300ms debounce', async () => {
    jest.useFakeTimers()
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()
    await act(async () => {
      jest.advanceTimersByTime(0)
    })

    act(() => {
      result.current.filters.setSearchInput('quick search')
    })

    const preventDefault = jest.fn()
    const fakeEvent = { preventDefault } as unknown as React.FormEvent

    act(() => {
      result.current.handleSearch(fakeEvent)
    })

    expect(preventDefault).toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(lastUrl()).toContain('search=quick')
    })

    jest.useRealTimers()
  })

  it('typing a search resets offset to 0', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 100, limit: 20, offset: 60 },
    }))
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    // Move to page 4 first
    act(() => {
      result.current.goToPage(4)
    })

    act(() => {
      result.current.filters.setSearchInput('reset me')
    })

    const preventDefault = jest.fn()
    act(() => {
      result.current.handleSearch({ preventDefault } as unknown as React.FormEvent)
    })

    // After search, offset is reset to 0 (next fetch uses offset=0)
    await waitFor(() => {
      expect(lastUrl()).toContain('offset=0')
    })
  })
})

// ============================================================================
// clearFilters
// ============================================================================

describe('clearFilters', () => {
  it('resets every filter dimension and offset', async () => {
    mockApiFetch.mockResolvedValue(okResponse())
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setCategory('laptop')
      result.current.filters.setCondition('good')
      result.current.filters.setSort('price_asc')
      result.current.filters.setSearchInput('apple')
      result.current.filters.setPriceMin('100')
      result.current.filters.setPriceMax('1000')
      result.current.filters.setSellerType('private')
      result.current.filters.setGratisOnly(true)
      result.current.filters.setVerifiedOnly(true)
      result.current.filters.setSpecRamMin('16')
      result.current.filters.setSpecStorageMin('256')
      result.current.filters.setSpecDisplayMin('13')
    })

    expect(result.current.hasActiveFilters).toBe(true)

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters.category).toBe('')
    expect(result.current.filters.condition).toBe('')
    expect(result.current.filters.sort).toBe('newest') // back to default
    expect(result.current.filters.searchInput).toBe('')
    expect(result.current.filters.priceMin).toBe('')
    expect(result.current.filters.priceMax).toBe('')
    expect(result.current.filters.sellerType).toBe('')
    expect(result.current.filters.gratisOnly).toBe(false)
    expect(result.current.filters.verifiedOnly).toBe(false)
    expect(result.current.filters.specRamMin).toBe('')
    expect(result.current.filters.specStorageMin).toBe('')
    expect(result.current.filters.specDisplayMin).toBe('')
    expect(result.current.hasActiveFilters).toBe(false)
  })
})

// ============================================================================
// hasActiveFilters
// ============================================================================

describe('hasActiveFilters', () => {
  beforeEach(() => {
    mockApiFetch.mockResolvedValue(okResponse())
  })

  it('false on initial mount', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('does NOT count default sort=newest as active', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    // Sort defaults to "newest" but hasActiveFilters explicitly excludes sort
    expect(result.current.filters.sort).toBe('newest')
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('true when only gratisOnly is set', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setGratisOnly(true)
    })

    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('true when only a spec filter is set', async () => {
    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.filters.setSpecRamMin('16')
    })

    expect(result.current.hasActiveFilters).toBe(true)
  })
})

// ============================================================================
// Pagination math
// ============================================================================

describe('pagination math', () => {
  it('totalPages = ceil(total / limit)', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 47, limit: 20, offset: 0 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(result.current.pagination.total).toBe(47))

    expect(result.current.totalPages).toBe(3) // ceil(47/20)
  })

  it('totalPages = 0 when total is 0', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 0, limit: 20, offset: 0 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    expect(result.current.totalPages).toBe(0)
  })

  it('currentPage = floor(offset / limit) + 1', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 100, limit: 20, offset: 40 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(result.current.pagination.offset).toBe(40))

    expect(result.current.currentPage).toBe(3) // floor(40/20) + 1
  })

  it('currentPage = 1 when offset = 0', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 50, limit: 20, offset: 0 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(result.current.pagination.offset).toBe(0))

    expect(result.current.currentPage).toBe(1)
  })

  it('goToPage(N) sets offset = (N-1) * limit', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 100, limit: 20, offset: 0 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.goToPage(5)
    })

    // After goToPage(5): offset = (5-1) * 20 = 80
    await waitFor(() => {
      expect(lastUrl()).toContain('offset=80')
    })
  })

  it('goToPage(1) returns to offset=0', async () => {
    mockApiFetch.mockResolvedValue(okResponse({
      pagination: { total: 100, limit: 20, offset: 60 },
    }))

    const { result } = renderListings()
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    act(() => {
      result.current.goToPage(5)
    })
    await waitFor(() => {
      expect(lastUrl()).toContain('offset=80')
    })

    act(() => {
      result.current.goToPage(1)
    })

    await waitFor(() => {
      expect(lastUrl()).toContain('offset=0')
    })
  })
})
