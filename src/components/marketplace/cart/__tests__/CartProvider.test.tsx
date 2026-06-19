/**
 * Tests for CartProvider / useCart — the marketplace cart state.
 *
 * Mission-relevant: this is the core commerce surface for RevampIT shop stock.
 * Getting totals, de-duplication or localStorage persistence wrong means a
 * buyer sees the wrong price or loses their cart — so the contract is locked:
 *
 *   - starts empty, hydrates from localStorage once on mount
 *   - add() appends; adding the same listing id twice is a no-op (items are
 *     unique, quantity-1 stock)
 *   - remove() / clear() mutate as expected
 *   - has() / count / total are derived correctly (total tolerates bad prices)
 *   - state persists to localStorage after hydration
 *   - corrupt / non-array storage is ignored (starts empty, never throws)
 *   - drawer open/close flags
 *   - useCart() throws outside a provider
 */

import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { CartProvider, useCart, type CartItem } from '../CartProvider'

const STORAGE_KEY = 'revampit-cart-v1'

function makeItem(over: Partial<CartItem> = {}): CartItem {
  return {
    id: 'listing-1',
    title: 'ThinkPad T480',
    priceChf: 250,
    thumbnail: null,
    category: 'laptop',
    condition: 'good',
    ...over,
  }
}

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

beforeEach(() => {
  localStorage.clear()
})

describe('CartProvider — initial state', () => {
  it('starts empty and becomes hydrated', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
    expect(result.current.total).toBe(0)
    // The mount effect runs synchronously under renderHook, so hydration
    // has completed by the time we read.
    expect(result.current.hydrated).toBe(true)
  })

  it('hydrates items from localStorage on mount', () => {
    const stored = [makeItem({ id: 'a', priceChf: 100 }), makeItem({ id: 'b', priceChf: 200 })]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))

    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.count).toBe(2)
    expect(result.current.total).toBe(300)
    expect(result.current.has('a')).toBe(true)
  })

  it('ignores corrupt storage and starts empty (never throws)', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.hydrated).toBe(true)
  })

  it('ignores non-array stored values', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: 'x' }))
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
  })
})

describe('CartProvider — mutations', () => {
  it('add() appends an item', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.add(makeItem({ id: 'a' })))
    expect(result.current.count).toBe(1)
    expect(result.current.has('a')).toBe(true)
  })

  it('add() is a no-op for a listing already in the cart (unique stock)', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.add(makeItem({ id: 'a', priceChf: 250 })))
    act(() => result.current.add(makeItem({ id: 'a', priceChf: 999 })))
    expect(result.current.count).toBe(1)
    // Original entry kept, not overwritten.
    expect(result.current.items[0].priceChf).toBe(250)
  })

  it('remove() drops the matching listing', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.add(makeItem({ id: 'a' }))
      result.current.add(makeItem({ id: 'b' }))
    })
    act(() => result.current.remove('a'))
    expect(result.current.count).toBe(1)
    expect(result.current.has('a')).toBe(false)
    expect(result.current.has('b')).toBe(true)
  })

  it('clear() empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.add(makeItem({ id: 'a' }))
      result.current.add(makeItem({ id: 'b' }))
    })
    act(() => result.current.clear())
    expect(result.current.count).toBe(0)
    expect(result.current.items).toEqual([])
  })
})

describe('CartProvider — derived total', () => {
  it('sums priceChf across items', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.add(makeItem({ id: 'a', priceChf: 120 }))
      result.current.add(makeItem({ id: 'b', priceChf: 80 }))
    })
    expect(result.current.total).toBe(200)
  })

  it('treats a non-numeric price as 0 rather than NaN', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => {
      result.current.add(makeItem({ id: 'a', priceChf: 100 }))
      // Simulate a malformed stored price slipping through.
      result.current.add(makeItem({ id: 'b', priceChf: Number.NaN }))
    })
    expect(result.current.total).toBe(100)
  })
})

describe('CartProvider — persistence', () => {
  it('persists items to localStorage after a mutation', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.add(makeItem({ id: 'a', priceChf: 250 })))

    const raw = localStorage.getItem(STORAGE_KEY)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('a')
  })

  it('persists an empty array after clearing', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => result.current.add(makeItem({ id: 'a' })))
    act(() => result.current.clear())
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([])
  })
})

describe('CartProvider — drawer', () => {
  it('toggles drawer visibility', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.drawerOpen).toBe(false)
    act(() => result.current.openDrawer())
    expect(result.current.drawerOpen).toBe(true)
    act(() => result.current.closeDrawer())
    expect(result.current.drawerOpen).toBe(false)
  })
})

describe('useCart — guard', () => {
  it('throws a clear error when used outside a CartProvider', () => {
    // Silence the expected React error boundary log for this case.
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useCart())).toThrow('useCart must be used within a CartProvider')
    spy.mockRestore()
  })
})
