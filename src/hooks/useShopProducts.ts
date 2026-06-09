/**
 * Hook for fetching published shop products
 *
 * Fetches from /api/shop/inventory - the same API that the customer shop uses.
 * This ensures admin "Shop Produkte" tab mirrors the customer-facing shop exactly.
 */

import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '@/lib/api/client'

export interface ShopProduct {
  id: string
  item_uuid: string
  title: string
  brand: string
  model: string
  description: string | null
  price: number
  condition: string
  category: string | null
  subcategory: string | null
  quantity: number
  image_url: string | null
  customer_profiles: Array<{
    slug: string
    name_de: string
    color: string
  }>
}

export interface ShopProductFilters {
  category?: string
  search?: string
  profile?: string
  limit?: number
  offset?: number
}

interface UseShopProductsReturn {
  data: { products: ShopProduct[]; total: number; limit: number; offset: number } | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useShopProducts(filters?: ShopProductFilters): UseShopProductsReturn {
  const category = filters?.category
  const search = filters?.search
  const profile = filters?.profile
  const limit = filters?.limit
  const offset = filters?.offset

  const [data, setData] = useState<{ products: ShopProduct[]; total: number; limit: number; offset: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)

      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (profile) params.set('profile', profile)
      if (limit) params.set('limit', limit.toString())
      if (offset) params.set('offset', offset.toString())

      const queryString = params.toString()
      const url = `/api/shop/inventory${queryString ? `?${queryString}` : ''}`

      const result = await apiFetch<{ products: ShopProduct[]; total: number; limit: number; offset: number }>(url)

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch shop products')
      }

      setData(result.data!)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [category, search, profile, limit, offset])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, isLoading, error, refetch: fetchProducts }
}
