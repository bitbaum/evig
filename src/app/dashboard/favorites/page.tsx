'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Heart,
  Loader2,
  AlertCircle,
  RefreshCw,
  MapPin,
} from 'lucide-react'
import { ListingImage } from '@/components/marketplace/ListingImage'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'

interface FavoriteListing {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  status: string
  is_revampit: boolean
  pickup_location: string | null
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string
  seller_display_name: string | null
  seller_city: string | null
  thumbnail: string | null
  favorited_at: string
}

export default function FavoritesPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/listings/favorites')
      const data = await response.json()
      if (data.success) {
        setFavorites(data.data.items)
      } else {
        throw new Error(data.error || 'Fehler beim Laden')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    fetchFavorites()
  }, [session, sessionStatus, router, fetchFavorites])

  const removeFavorite = async (listingId: string) => {
    setRemovingId(listingId)
    try {
      const response = await fetch(`/api/listings/${listingId}/favorite`, { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setFavorites(prev => prev.filter(f => f.id !== listingId))
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Meine Favoriten
        </Heading>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Ihre gemerkten Inserate auf einen Blick
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Favoriten werden geladen...</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <Button onClick={fetchFavorites} variant="destructive" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </Button>
        </div>
      )}

      {!isLoading && !error && favorites.length === 0 && (
        <EmptyState
          icon={Heart}
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-500 dark:text-rose-400"
          title="Noch keine Favoriten"
          description="Klicke auf das Herz-Symbol bei einem Inserat, um es hier zu speichern."
          action={
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              Marketplace durchsuchen
            </Link>
          }
        />
      )}

      {!isLoading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((listing) => {
            const conditionInfo = getConditionBadge(listing.condition)
            const sellerName = listing.seller_display_name || listing.seller_name
            return (
              <div
                key={listing.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
              >
                <Link href={`/marketplace/${listing.id}`}>
                  <div className="relative aspect-[4/3]">
                    <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-12 h-12" />
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>
                    {listing.status !== 'active' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {listing.status === 'sold' ? 'Verkauft' : 'Nicht verfügbar'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Heading level={3} className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-green-600 transition-colors">
                      {listing.title}
                    </Heading>
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {formatCHF(Number(listing.price_chf))}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{sellerName}</span>
                      {listing.seller_city && (
                        <span className="flex items-center gap-0.5 flex-shrink-0">
                          <MapPin className="w-3 h-3" />
                          {listing.seller_city}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <button
                    onClick={() => removeFavorite(listing.id)}
                    disabled={removingId === listing.id}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {removingId === listing.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3 fill-red-500" />
                    )}
                    Entfernen
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
