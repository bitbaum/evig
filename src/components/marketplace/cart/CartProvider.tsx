'use client'

/**
 * Marketplace cart — RevampIT shop stock only (is_revampit listings).
 *
 * RevampIT items are unique (quantity 1), so the cart is simply a set of
 * listings. State is client-side and persisted to localStorage; there is no
 * server-side cart for v1. P2P community listings do NOT use the cart (they
 * stay direct-buy / contact-seller), matching the Galaxus-vs-Ricardo split.
 */
import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'

export interface CartItem {
  /** listing id */
  id: string
  title: string
  priceChf: number
  thumbnail: string | null
  category: string
  condition: string
}

interface CartState {
  items: CartItem[]
  count: number
  total: number
  hydrated: boolean
  has: (id: string) => boolean
  add: (item: CartItem) => void
  remove: (id: string) => void
  clear: () => void
}

const CartContext = createContext<CartState | null>(null)
const STORAGE_KEY = 'revampit-cart-v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Load once on mount (client only).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      /* corrupt storage — start empty */
    }
    setHydrated(true)
  }, [])

  // Persist on change (after hydration so we don't clobber stored state).
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* ignore quota/availability errors */
    }
  }, [items, hydrated])

  const add = useCallback((item: CartItem) => {
    setItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item]))
  }, [])
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartState>(() => {
    const total = items.reduce((sum, i) => sum + (Number(i.priceChf) || 0), 0)
    return {
      items,
      count: items.length,
      total,
      hydrated,
      has: (id: string) => items.some((i) => i.id === id),
      add,
      remove,
      clear,
    }
  }, [items, hydrated, add, remove, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
