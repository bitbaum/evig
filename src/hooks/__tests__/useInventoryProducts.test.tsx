/**
 * Tests for useInventoryProducts — admin inventory data hook.
 *
 * Powers the /admin/inventory list. Mission-relevant: a regression
 * here breaks the admin's view into the entire warehouse stock.
 *
 * Locks:
 *   - GET /api/admin/inventory on mount
 *   - data populated on success
 *   - error wrapped as Error on failure with fallback messages
 *   - isLoading lifecycle (true initially, false after both success
 *     and failure via finally)
 *   - refetch() re-runs the query
 *   - refetch() recovers from previous error (clears it on success)
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useInventoryProducts } from '../useInventoryProducts'

const sampleProduct = {
  id: 'p1',
  item_uuid: 'I-260101-0001',
  product_name: 'MacBook Pro',
  brand: 'Apple',
  short_description: null,
  estimated_price_chf: 1500,
  condition: 'good',
  category: 'laptop',
  subcategory: null,
  status: 'pending',
  created_at: '2026-01-01T10:00:00Z',
  location: null,
  box_id: null,
  quantity_available: 1,
  marketplace_status: 'draft',
  customer_profiles: [],
  image_url: null,
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial fetch
// ============================================================================

describe('useInventoryProducts — initial fetch', () => {
  it('starts with isLoading=true, data=null, error=null', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { products: [], total: 0 } })

    const { result } = renderHook(() => useInventoryProducts())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })

  it('GETs /api/admin/inventory', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { products: [], total: 0 } })

    renderHook(() => useInventoryProducts())

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())
    expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/inventory')
  })

  it('populates data on success', async () => {
    mockApiFetch.mockResolvedValue({
      success: true,
      data: { products: [sampleProduct], total: 1 },
    })

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.total).toBe(1)
    expect(result.current.data?.products[0].id).toBe('p1')
    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('useInventoryProducts — failures', () => {
  it('success=false → error wrapped as Error with provided message', async () => {
    mockApiFetch.mockResolvedValue({ success: false, error: 'Forbidden' })

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Forbidden')
  })

  it('success=false without error → "Failed to fetch inventory products" fallback', async () => {
    mockApiFetch.mockResolvedValue({ success: false })

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('Failed to fetch inventory products')
  })

  it('thrown Error preserved with .message intact', async () => {
    mockApiFetch.mockRejectedValue(new Error('Network down'))

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error?.message).toBe('Network down')
  })

  it('non-Error throws wrapped with "Unknown error" fallback', async () => {
    mockApiFetch.mockRejectedValue('weird non-Error throw')

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Unknown error')
  })

  it('isLoading flips to false even after error (finally block)', async () => {
    mockApiFetch.mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
  })
})

// ============================================================================
// Refetch
// ============================================================================

describe('useInventoryProducts — refetch', () => {
  it('refetch() re-runs the query', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { products: [], total: 0 } })

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockApiFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockApiFetch).toHaveBeenCalledTimes(2)
  })

  it('refetch() clears previous error when the new attempt succeeds', async () => {
    mockApiFetch
      .mockRejectedValueOnce(new Error('first error'))
      .mockResolvedValueOnce({ success: true, data: { products: [sampleProduct], total: 1 } })

    const { result } = renderHook(() => useInventoryProducts())

    await waitFor(() => expect(result.current.error).not.toBeNull())

    await act(async () => {
      await result.current.refetch()
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data?.total).toBe(1)
  })
})
