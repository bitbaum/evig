/**
 * Hook for fetching inventory products from the local database
 */

import { useState, useEffect, useCallback } from 'react'

export interface InventoryProduct {
  id: string
  item_uuid: string
  product_name: string
  brand: string
  short_description: string | null
  estimated_price_chf: number
  condition: string
  category: string | null
  subcategory: string | null
  status: string
  created_at: string
  location: string | null
  box_id: string | null
  quantity_available: number
  marketplace_status: string
  customer_profiles: string[]
}

interface UseInventoryProductsReturn {
  data: { products: InventoryProduct[]; total: number } | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useInventoryProducts(): UseInventoryProductsReturn {
  const [data, setData] = useState<{ products: InventoryProduct[]; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory products')
      }
      const result = await response.json()
      setData(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, isLoading, error, refetch: fetchProducts }
}
