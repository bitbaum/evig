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
  const [data, setData] = useState<{ products: ShopProduct[]; total: number; limit: number; offset: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (filters?.category) params.set('category', filters.category)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.profile) params.set('profile', filters.profile)
      if (filters?.limit) params.set('limit', filters.limit.toString())
      if (filters?.offset) params.set('offset', filters.offset.toString())

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
  }, [filters?.category, filters?.search, filters?.profile, filters?.limit, filters?.offset])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, isLoading, error, refetch: fetchProducts }
}
