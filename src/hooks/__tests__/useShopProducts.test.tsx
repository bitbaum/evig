/**
 * Tests for useShopProducts — admin "Shop Produkte" tab data hook.
 *
 * Mission-relevant: this hook powers the admin shop-inventory view
 * and (per its module docstring) MUST mirror the customer-facing shop
 * exactly by hitting the same /api/shop/inventory endpoint. A regression
 * here means staff see different inventory than customers — high-trust
 * UX bug.
 *
 * Locks the contract:
 *   - initial state: isLoading=true, data=null, error=null
 *   - URL construction: only-defined-filters become query params,
 *     no query string when no filters provided (no trailing "?")
 *   - GET /api/shop/inventory base path is fixed
 *   - happy path: data set, error=null, isLoading=false
 *   - apiFetch returning success=false → error populated, data unchanged
 *   - thrown exceptions wrapped as Error, isLoading flips back to false
 *   - refetch() re-runs the same query
 *   - filter changes trigger re-fetch (useEffect dependency)
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

import { renderHook, waitFor, act } from '@testing-library/react'
import { useShopProducts } from '../useShopProducts'

beforeEach(() => {
  mockApiFetch.mockReset()
})

const sampleProduct = {
  id: 'p1',
  item_uuid: 'I-260204-0001',
  title: 'Apple MacBook Pro 14"',
  brand: 'Apple',
  model: 'MacBook Pro',
  description: 'Refurbished',
  price: 1500,
  condition: 'good',
  category: 'laptop',
  subcategory: null,
  quantity: 1,
  image_url: '/uploads/products/I-260204-0001.jpg',
  customer_profiles: [],
}

const sampleResponse = { products: [sampleProduct], total: 1, limit: 20, offset: 0 }

// ============================================================================
// Initial state + happy path
// ============================================================================

describe('useShopProducts — initial fetch', () => {
  it('starts with isLoading=true, data=null, error=null', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    const { result } = renderHook(() => useShopProducts())

    // Synchronously: still loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(sampleResponse)
    expect(result.current.error).toBeNull()
  })

  it('hits /api/shop/inventory (the same endpoint the customer shop uses)', async () => {
    // Documented invariant from the hook's module docstring
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts())

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch.mock.calls[0][0]).toBe('/api/shop/inventory')
  })

  it('omits the query string entirely when no filters provided (no trailing "?")', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts())

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toBe('/api/shop/inventory')
    expect(url).not.toContain('?')
  })
})

// ============================================================================
// URL construction
// ============================================================================

describe('useShopProducts — URL construction', () => {
  it('appends category as a query param', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({ category: 'laptop' }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch.mock.calls[0][0]).toBe('/api/shop/inventory?category=laptop')
  })

  it('appends search and profile params', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({ search: 'macbook', profile: 'student' }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain('search=macbook')
    expect(url).toContain('profile=student')
  })

  it('appends limit and offset (numbers stringified)', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({ limit: 50, offset: 100 }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain('limit=50')
    expect(url).toContain('offset=100')
  })

  it('combines all filters into a single query string', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({
      category: 'laptop',
      search: 'apple',
      profile: 'student',
      limit: 20,
      offset: 0,
    }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).toContain('category=laptop')
    expect(url).toContain('search=apple')
    expect(url).toContain('profile=student')
    expect(url).toContain('limit=20')
    // offset=0 is falsy → not appended (documented behavior — limit truthy
    // check uses `if (filters?.offset)` which excludes 0)
  })

  it('drops empty-string filters (treats falsy as omitted)', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({ category: '', search: 'macbook' }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    expect(url).not.toContain('category=')
    expect(url).toContain('search=macbook')
  })

  it('URL-encodes special characters in filter values', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    renderHook(() => useShopProducts({ search: 'macbook pro 14"' }))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    const url = mockApiFetch.mock.calls[0][0] as string
    // URLSearchParams encodes space → '+' and " → %22
    expect(url).toMatch(/search=macbook[+%]/)
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('useShopProducts — failures', () => {
  it('apiFetch returning success=false → error set with provided message', async () => {
    mockApiFetch.mockResolvedValue({ success: false, error: 'Service unavailable' })

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Service unavailable')
    expect(result.current.data).toBeNull()
  })

  it('apiFetch returning success=false without error → uses fallback message', async () => {
    mockApiFetch.mockResolvedValue({ success: false })

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('Failed to fetch shop products')
  })

  it('thrown exception is caught and wrapped as Error', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('Network down')
  })

  it('non-Error throw wrapped with "Unknown error" fallback', async () => {
    mockApiFetch.mockRejectedValue('weird non-Error throw')

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Unknown error')
  })

  it('isLoading flips back to false even after error (finally block runs)', async () => {
    mockApiFetch.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})

// ============================================================================
// refetch
// ============================================================================

describe('useShopProducts — refetch', () => {
  it('refetch() re-runs the same query', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    const { result } = renderHook(() => useShopProducts({ category: 'laptop' }))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockApiFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockApiFetch).toHaveBeenCalledTimes(2)
    // Same URL on re-fetch
    expect(mockApiFetch.mock.calls[1][0]).toBe('/api/shop/inventory?category=laptop')
  })

  it('refetch() recovers from previous error → data populated, error cleared', async () => {
    mockApiFetch
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ success: true, data: sampleResponse })

    const { result } = renderHook(() => useShopProducts())

    await waitFor(() => expect(result.current.error).not.toBeNull())

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toEqual(sampleResponse)
  })
})

// ============================================================================
// Filter changes trigger re-fetch
// ============================================================================

describe('useShopProducts — filter changes', () => {
  it('changing category triggers a new fetch', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: sampleResponse })

    const { result, rerender } = renderHook(
      (props: { filters?: { category?: string } }) => useShopProducts(props.filters),
      { initialProps: { filters: { category: 'laptop' } } },
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockApiFetch).toHaveBeenCalledTimes(1)

    rerender({ filters: { category: 'phone' } })

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(2))
    expect(mockApiFetch.mock.calls[1][0]).toBe('/api/shop/inventory?category=phone')
  })
})
