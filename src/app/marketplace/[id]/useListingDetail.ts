import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import type { ListingDetail, SimilarListing } from './types'

interface UseListingDetailReturn {
  listing: ListingDetail | null
  isLoading: boolean
  error: string | null
  isFavorited: boolean
  setIsFavorited: (v: boolean) => void
  favoriteCount: number
  setFavoriteCount: (v: number) => void
  similarListings: SimilarListing[]
}

export function useListingDetail(params: Promise<{ id: string }>): UseListingDetailReturn {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([])

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/listings/${id}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()

        if (data.success && data.data) {
          setListing(data.data)
          setIsFavorited(data.data.is_favorited)
          setFavoriteCount(data.data.favorite_count)
          // Fetch similar listings
          fetch(`/api/listings/similar?listing_id=${data.data.id}&limit=4`)
            .then(res => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`)
              return res.json()
            })
            .then(simData => {
              if (simData.success && simData.data) setSimilarListings(simData.data)
            })
            .catch(err => logger.warn('Failed to load similar listings', { error: err }))
        } else {
          setError(data.error || 'Inserat nicht gefunden')
        }
      } catch {
        setError('Fehler beim Laden des Inserats')
      } finally {
        setIsLoading(false)
      }
    }
    fetchListing()
  }, [params])

  return {
    listing,
    isLoading,
    error,
    isFavorited,
    setIsFavorited,
    favoriteCount,
    setFavoriteCount,
    similarListings,
  }
}
