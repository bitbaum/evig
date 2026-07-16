'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import {
  ArrowLeft,
  User,
  MapPin,
  Star,
  Package,
  Loader2,
  AlertCircle,
  Calendar,
  ShoppingBag,
  BadgeCheck,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { SellerReviews, type SellerReview } from '@/components/marketplace/SellerReviews'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

interface SellerProfile {
  id: string
  user_id: string
  display_name: string | null
  user_name: string
  bio: string | null
  avatar_url: string | null
  city: string | null
  canton: string | null
  is_verified: boolean
  total_listings: number
  total_sold: number
  average_rating: number | null
  total_reviews: number
  member_since: string
  listings: Array<{
    id: string
    title: string
    price_chf: number
    category: string
    condition: string
    thumbnail: string | null
    is_revampit: boolean
    pickup_location: string | null
    verified_at: string | null
    created_at: string
  }>
  review_stats: {
    average_rating: number | null
    review_count: number
    histogram: Record<string, number>
  }
  reviews: SellerReview[]
}

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('sellers')
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { id } = await params
        const result = await apiFetch<{
          profile: Omit<SellerProfile, 'member_since' | 'listings' | 'review_stats' | 'reviews'> & { created_at: string }
          listings: SellerProfile['listings']
          review_stats: { average_rating: number | null; total_reviews: number; histogram: Record<string, number> }
          reviews: SellerReview[]
        }>(`/api/sellers/${id}`)

        if (result.success && result.data) {
          const { profile, listings, review_stats, reviews } = result.data
          setSeller({
            ...profile,
            member_since: profile.created_at,
            listings,
            review_stats: {
              average_rating: review_stats.average_rating,
              review_count: review_stats.total_reviews,
              histogram: review_stats.histogram,
            },
            reviews,
          })
        } else {
          setError(result.error || t('sellerNotFound'))
        }
      } catch (err) {
        logger.warn('Failed to load seller profile', { error: err })
        setError(t('errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchSeller()
  }, [params, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-action animate-spin" />
        <span className="ml-3 text-text-secondary">{t('loadingProfile')}</span>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4" />
        <Heading level={2} className="text-xl text-text-primary mb-2">
          {error || t('sellerNotFound')}
        </Heading>
        <Link href={ROUTES.public.marketplace} className="text-action hover:text-action font-medium">
          {t('backToMarketplace')}
        </Link>
      </div>
    )
  }

  const displayName = seller.display_name || seller.user_name
  const rating = seller.review_stats.average_rating ?? seller.average_rating
  const reviewCount = seller.review_stats.review_count || seller.total_reviews

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href={ROUTES.public.marketplace}
        className="inline-flex items-center gap-2 text-text-secondary hover:text-action mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToMarketplace')}
      </Link>

      {/* Seller Header */}
      <div className="mb-8 border-b border-subtle pb-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-subtle bg-action-muted flex items-center justify-center">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt={displayName} width={80} height={80} className="h-20 w-20 object-cover" />
            ) : (
              <User className="h-9 w-9 text-action" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
              {t('publicProfile')}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Heading level={1} className="text-3xl font-semibold text-text-primary sm:text-4xl">{displayName}</Heading>
              {seller.is_verified && (
                <BadgeCheck className="h-6 w-6 shrink-0 text-action" aria-label={t('verified')} />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text-tertiary">
              {seller.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {seller.city}{seller.canton ? `, ${seller.canton}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('memberSince', { date: formatDateShort(seller.member_since) })}
              </span>
              {seller.is_verified && (
                <span className="font-medium text-action">{t('verified')}</span>
              )}
            </div>
            {seller.bio && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary">{seller.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 divide-x divide-subtle rounded-lg border border-subtle bg-surface-base">
          <div className="p-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">
              {seller.total_listings}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">{t('listings')}</div>
          </div>
          <div className="p-4">
            <div className="font-mono text-xl font-semibold tabular-nums text-text-primary">
              {seller.total_sold}
            </div>
            <div className="mt-1 text-xs text-text-tertiary">{t('sold')}</div>
          </div>
          <div className="p-4">
            {rating && Number(rating) > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                <span className="font-mono text-xl font-semibold tabular-nums text-text-primary">
                  {Number(rating).toFixed(1)}
                </span>
              </div>
            ) : (
              <div className="font-mono text-xl font-semibold text-text-muted">—</div>
            )}
            <div className="mt-1 text-xs text-text-tertiary">
              {reviewCount > 0 ? t('ratingsCount', { count: reviewCount }) : t('noRatings')}
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div>
        <Heading level={2} className="text-lg text-text-primary mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {t('activeListings', { count: seller.listings.length })}
        </Heading>

        {seller.listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('noListingsTitle')}
            description={t('noListingsDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {seller.listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{
                  id: listing.id,
                  title: listing.title,
                  price_chf: listing.price_chf,
                  category: listing.category,
                  condition: listing.condition,
                  is_revampit: listing.is_revampit,
                  pickup_location: listing.pickup_location,
                  verified_at: listing.verified_at,
                  seller_name: displayName,
                  seller_display_name: displayName,
                  seller_rating: rating,
                  seller_city: seller.city,
                  seller_is_verified: seller.is_verified,
                  thumbnail: listing.thumbnail,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <SellerReviews
        reviews={seller.reviews}
        average={Number(rating) || 0}
        total={reviewCount}
        histogram={seller.review_stats.histogram}
      />
    </div>
  )
}
