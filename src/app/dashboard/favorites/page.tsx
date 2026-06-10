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
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF, LISTING_STATUS } from '@/config/marketplace'
import { ROUTES } from '@/config/routes'

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
  const t = useTranslations('dashboard.favorites')
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const result = await apiFetch<{ items: FavoriteListing[] }>('/api/listings/favorites')
    if (result.success && result.data) {
      setFavorites(result.data.items)
    } else {
      setError(result.error || t('loadError'))
    }
    setIsLoading(false)
  }, [t])

  // Auth-gated data load. setState happens inside fetchFavorites — this is
  // the legitimate "subscribe to external system on session change" pattern.
   
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
      const result = await apiFetch<unknown>(`/api/listings/${listingId}/favorite`, { method: 'POST' })
      if (result.success) {
        setFavorites(prev => prev.filter(f => f.id !== listingId))
      }
    } finally {
      setRemovingId(null)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
      </div>
    )
  }

  return (
    <article className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6 lg:px-8">
      <header className="border-b border-subtle pb-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-text-tertiary">
          {t('pageSubtitle')}
        </p>
        <Heading
          level={1}
          className="mt-2 flex items-center gap-2 text-3xl font-semibold text-text-primary sm:text-4xl"
        >
          <Heart className="h-6 w-6 text-error-500" />
          {t('pageTitle')}
        </Heading>
      </header>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
          <span className="ml-3 text-text-secondary">{t('loading')}</span>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 dark:text-error-300 mb-4">{error}</p>
          <Button onClick={fetchFavorites} variant="destructive" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
        </div>
      )}

      {!isLoading && !error && favorites.length === 0 && (
        <EmptyState
          icon={Heart}
          iconBg="bg-error-50 dark:bg-error-900/20"
          iconColor="text-error-500 dark:text-error-400"
          title={t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Button as={Link} href={ROUTES.public.marketplace} variant="primary">
              {t('browseMarketplace')}
            </Button>
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
                className="group bg-surface-base rounded-xl border border-subtle overflow-hidden"
              >
                <Link href={`/marketplace/${listing.id}`}>
                  <div className="relative aspect-4/3">
                    <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-12 h-12" />
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>
                    {listing.status !== LISTING_STATUS.ACTIVE && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {listing.status === LISTING_STATUS.SOLD ? t('statusSold') : t('statusUnavailable')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Heading level={3} className="font-semibold text-text-primary mb-1 line-clamp-2 text-sm group-hover:text-action transition-colors">
                      {listing.title}
                    </Heading>
                    <p className="text-lg font-bold text-text-primary mb-1">
                      {formatCHF(Number(listing.price_chf))}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="truncate">{sellerName}</span>
                      {listing.seller_city && (
                        <span className="flex items-center gap-0.5 shrink-0">
                          <MapPin className="w-3 h-3" />
                          {listing.seller_city}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="px-3 pb-3">
                  <Button
                    onClick={() => removeFavorite(listing.id)}
                    disabled={removingId === listing.id}
                    variant="destructive-ghost"
                    size="sm"
                    className="w-full gap-1"
                  >
                    {removingId === listing.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3 fill-error-500" />
                    )}
                    {t('removeButton')}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
