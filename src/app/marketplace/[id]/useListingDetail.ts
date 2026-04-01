import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
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
    let cancelled = false
    async function load() {
      try {
        const { id } = await params
        const result = await apiFetch<ListingDetail>(`/api/listings/${id}`)

        if (cancelled) return

        if (result.success && result.data) {
          setListing(result.data)
          setIsFavorited(result.data.is_favorited)
          setFavoriteCount(result.data.favorite_count)
          // Fetch similar listings
          apiFetch<SimilarListing[]>(`/api/listings/similar?listing_id=${result.data.id}&limit=4`)
            .then(simResult => {
              if (!cancelled && simResult.success && simResult.data) {
                setSimilarListings(simResult.data)
              }
            })
            .catch(err => logger.warn('Failed to load similar listings', { error: err }))
        } else {
          setError(result.error || 'Inserat nicht gefunden')
        }
      } catch {
        if (!cancelled) setError('Fehler beim Laden des Inserats')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
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
