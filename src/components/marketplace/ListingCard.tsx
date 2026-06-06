'use client'

/**
 * ListingCard — fleetcrown discipline edition.
 *
 * One layout regardless of state. No floating overlay badges, no spec
 * chip rail, no view/favorite counters, no decorative icons. Hierarchy
 * comes from typography and a monospace eyebrow.
 *
 * Special state (verified, RevampIT, gratis) is conveyed inline in the
 * meta eyebrow, never as a colored pill floating on the image.
 */

import { Link } from '@/i18n/navigation'
import { getConditionLabel } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'
import { ListingImage } from './ListingImage'
import { ORG } from '@/config/org'

export interface ListingCardData {
  id: string
  title: string
  price_chf: number
  category: string
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
  verified_at?: string | null
  specs?: Array<{ key: string; value: string; unit: string | null }>
}

interface ListingCardProps {
  listing: ListingCardData
  variant?: 'default' | 'compact'
  className?: string
}

export function ListingCard({ listing, variant = 'default', className = '' }: ListingCardProps) {
  const sellerName = listing.seller_display_name || listing.seller_name
  const isCompact = variant === 'compact'
  const isGratis = Number(listing.price_chf) === 0
  const isVerified = !!listing.verified_at
  const conditionLabel = getConditionLabel(listing.condition)

  // Eyebrow = monochrome meta line. Order: source (RevampIT vs P2P) ·
  // condition · verified. Pure text, no chrome.
  const eyebrowParts = [
    listing.is_revampit ? ORG.name : null,
    conditionLabel?.toUpperCase() ?? null,
    isVerified ? 'VERIFIZIERT' : null,
  ].filter(Boolean) as string[]

  const location = listing.pickup_location || listing.seller_city

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className={`group card-shell overflow-hidden hover:border-strong transition-colors block ${className}`}
    >
      <div className={`relative ${isCompact ? 'aspect-square' : 'aspect-4/3'}`}>
        <ListingImage
          src={listing.thumbnail}
          alt={listing.title}
          fallbackIconSize={isCompact ? 'w-8 h-8' : 'w-12 h-12'}
        />
      </div>

      <div className={isCompact ? 'p-3' : 'p-4'}>
        {eyebrowParts.length > 0 && (
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary mb-2 truncate">
            {eyebrowParts.join(' · ')}
          </div>
        )}

        <h3 className={`font-semibold text-text-primary line-clamp-2 ${isCompact ? 'text-sm' : 'text-base'}`}>
          {listing.title}
        </h3>

        <div className={`mt-3 font-mono tabular-nums ${isCompact ? 'text-base' : 'text-lg'} font-semibold text-text-primary`}>
          {isGratis ? 'GRATIS' : formatCHF(Number(listing.price_chf))}
        </div>

        <div className="mt-3 pt-3 border-t border-subtle font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary truncate">
          {sellerName}
          {location && <> · {location}</>}
        </div>
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
