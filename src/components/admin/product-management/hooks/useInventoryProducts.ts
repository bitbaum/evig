'use client'

import { useState, useEffect } from 'react'
import type { InventoryProduct } from '../types'

interface InventoryData {
  products: InventoryProduct[]
  total: number
}

export function useInventoryProducts() {
  const [data, setData] = useState<InventoryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProducts = async () => {
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
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return { data, isLoading, error, refetch: fetchProducts }
}
