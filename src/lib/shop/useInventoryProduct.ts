import { useState, useEffect } from 'react'

export interface InventoryProductDetail {
  id: string
  item_uuid: string
  title: string
  brand: string
  model: string
  description: string | null
  specifications: Record<string, string>
  price: number
  condition: string
  dimensions: { laenge_mm?: number; breite_mm?: number; hoehe_mm?: number } | null
  weight_grams: number | null
  category: string | null
  subcategory: string | null
  quantity: number
  is_available: boolean
  images: Array<{ id: string; url: string; is_primary: boolean }>
  customer_profiles: Array<{ slug: string; name_de: string; color: string; description_de: string }>
}

export function isUUID(id: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(id)
}

export function useInventoryProduct(id: string) {
  const [data, setData] = useState<InventoryProductDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/shop/inventory/${id}`)
        if (!response.ok) {
          throw new Error('Product not found')
        }
        const result = await response.json()
        if (result.success && result.data?.product) {
          setData(result.data.product)
        } else {
          throw new Error(result.error || 'Product not found')
        }
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setIsLoading(false)
      }
    }

    if (id && isUUID(id)) {
      fetchProduct()
    }
  }, [id])

  return { data, isLoading: isUUID(id) ? isLoading : false, error }
}
