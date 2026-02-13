/**
 * ListingCard Component
 *
 * Reusable card component for marketplace listings.
 * Eliminates ~150 lines of duplicated code across marketplace pages.
 */

import Link from 'next/link'
import { Package, TrendingUp, Star, MapPin, Heart } from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'

export interface ListingCardData {
  id: string
  title: string
  price_chf: number
  condition: string
  is_revampit: boolean
  pickup_location: string | null
  view_count: number
  favorite_count: number
  seller_name: string
  seller_display_name: string | null
  seller_rating: number | null
  seller_city: string | null
  thumbnail: string | null
}

interface ListingCardProps {
  listing: ListingCardData
  variant?: 'default' | 'compact'
  className?: string
}

export function ListingCard({ listing, variant = 'default', className = '' }: ListingCardProps) {
  const conditionInfo = getConditionBadge(listing.condition)
  const sellerName = listing.seller_display_name || listing.seller_name
  const isCompact = variant === 'compact'

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className={`group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      {/* Image */}
      <div className={`relative ${isCompact ? 'aspect-square' : 'aspect-[4/3]'}`}>
        {listing.thumbnail ? (
          <img
            src={listing.thumbnail}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Package className={`${isCompact ? 'w-8 h-8' : 'w-12 h-12'} text-gray-300 dark:text-gray-500`} />
          </div>
        )}

        {/* Condition Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
            {conditionInfo.label}
          </span>
        </div>

        {/* RevampIT Badge */}
        {listing.is_revampit && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              <TrendingUp className="w-3 h-3" />
              {!isCompact && 'RevampIT'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={isCompact ? 'p-2 md:p-3' : 'p-3 md:p-4'}>
        <h3 className={`font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2 ${isCompact ? 'text-xs md:text-sm' : 'text-sm md:text-base'} group-hover:text-green-600 transition-colors`}>
          {listing.title}
        </h3>

        <p className={`${isCompact ? 'text-base' : 'text-lg'} font-bold text-gray-900 dark:text-white mb-2`}>
          {formatCHF(Number(listing.price_chf))}
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="truncate">{sellerName}</span>
          {listing.seller_rating && Number(listing.seller_rating) > 0 && (
            <span className="inline-flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {Number(listing.seller_rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Location */}
        {(listing.pickup_location || listing.seller_city) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{listing.pickup_location || listing.seller_city}</span>
          </div>
        )}

        {/* Stats */}
        {!isCompact && (
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span>{listing.view_count} Aufrufe</span>
            {listing.favorite_count > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Heart className="w-3 h-3" />
                {listing.favorite_count}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/**
 * ListingCardGrid - Grid container for listing cards
 */
interface ListingCardGridProps {
  children: React.ReactNode
  variant?: 'default' | 'compact'
  className?: string
}

export function ListingCardGrid({ children, variant = 'default', className = '' }: ListingCardGridProps) {
  const gridClass = variant === 'compact'
    ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className={`${gridClass} gap-4 md:gap-6 ${className}`}>
      {children}
    </div>
  )
}
