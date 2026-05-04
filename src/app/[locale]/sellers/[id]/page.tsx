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
} from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatCHF } from '@/config/marketplace'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { useTranslations } from 'next-intl'

interface SellerProfile {
  id: string
  user_id: string
  display_name: string | null
  user_name: string
  bio: string | null
  avatar_url: string | null
  city: string | null
  canton: string | null
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
    view_count: number
    favorite_count: number
    created_at: string
  }>
  review_stats: {
    average_rating: number | null
    review_count: number
  }
}

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('techniker')
  const [seller, setSeller] = useState<SellerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { id } = await params
        const result = await apiFetch<{
          profile: Omit<SellerProfile, 'member_since' | 'listings' | 'review_stats'> & { created_at: string }
          listings: SellerProfile['listings']
          review_stats: { average_rating: number | null; total_reviews: number }
        }>(`/api/sellers/${id}`)

        if (result.success && result.data) {
          const { profile, listings, review_stats } = result.data
          setSeller({
            ...profile,
            member_since: profile.created_at,
            listings,
            review_stats: {
              average_rating: review_stats.average_rating,
              review_count: review_stats.total_reviews,
            },
          })
        } else {
          setError(result.error || t('seller.sellerNotFound'))
        }
      } catch (err) {
        logger.warn('Failed to load seller profile', { error: err })
        setError(t('seller.errorLoading'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchSeller()
  }, [params, t])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">{t('seller.loadingProfile')}</span>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <AlertCircle className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <Heading level={2} className="text-xl text-neutral-900 dark:text-white mb-2">
          {error || t('seller.sellerNotFound')}
        </Heading>
        <Link href="/marketplace" className="text-primary-600 hover:text-primary-700 font-medium">
          {t('seller.backToMarketplace')}
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
        href="/marketplace"
        className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('seller.backToMarketplace')}
      </Link>

      {/* Seller Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center flex-shrink-0">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt={displayName} width={64} height={64} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-primary-600" />
            )}
          </div>
          <div className="flex-1">
            <Heading level={1} className="text-2xl text-neutral-900 dark:text-white">{displayName}</Heading>
            <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              {seller.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {seller.city}{seller.canton ? `, ${seller.canton}` : ''}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t('seller.memberSince', { date: formatDateShort(seller.member_since) })}
              </span>
            </div>
            {seller.bio && (
              <p className="mt-3 text-neutral-600 dark:text-neutral-300 text-sm">{seller.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {seller.total_listings}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{t('seller.listings')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-neutral-900 dark:text-white">
              {seller.total_sold}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{t('seller.sold')}</div>
          </div>
          <div className="text-center">
            {rating && Number(rating) > 0 ? (
              <div className="flex items-center justify-center gap-1">
                <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                <span className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {Number(rating).toFixed(1)}
                </span>
              </div>
            ) : (
              <div className="text-2xl font-bold text-neutral-400">—</div>
            )}
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              {reviewCount > 0 ? t('seller.ratingsCount', { count: reviewCount }) : t('seller.noRatings')}
            </div>
          </div>
        </div>
      </div>

      {/* Active Listings */}
      <div>
        <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          {t('seller.activeListings', { count: seller.listings.length })}
        </Heading>

        {seller.listings.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('seller.noListingsTitle')}
            description={t('seller.noListingsDescription')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {seller.listings.map((listing) => {
              const conditionInfo = getConditionBadge(listing.condition)
              return (
                <Link
                  key={listing.id}
                  href={`/marketplace/${listing.id}`}
                  className="group bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[4/3]">
                    {listing.thumbnail ? (
                      <img
                        src={listing.thumbnail}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                        <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-500" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                        {conditionInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <Heading level={3} className="font-semibold text-neutral-900 dark:text-white mb-1 line-clamp-2 text-sm group-hover:text-primary-600 transition-colors">
                      {listing.title}
                    </Heading>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">
                      {formatCHF(Number(listing.price_chf))}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
