'use client'

/**
 * ListingCard Component
 *
 * Reusable card component for marketplace listings.
 * Shows spec tags, gratis badge, and verified badge.
 */

import { Link } from '@/i18n/navigation'
import { Star, MapPin, Heart, ShieldCheck } from 'lucide-react'
import { getConditionBadge } from '@/config/erfassung/conditions'
import { formatCHF, GRATIS_CONFIG, VERIFICATION_CONFIG, SPEC_DISPLAY_PRIORITY } from '@/config/marketplace'
import { ListingImage } from './ListingImage'
import { CO2Badge } from './CO2Badge'
import Heading from '@/components/ui/Heading'
import { ORG } from '@/config/org'
import { useTranslations } from 'next-intl'

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

/** Pick the most important specs to show as tags on the card (max 3) */
function getSpecTags(specs?: Array<{ key: string; value: string; unit: string | null }>): string[] {
  if (!specs || specs.length === 0) return []
  const tags: string[] = []
  for (const key of SPEC_DISPLAY_PRIORITY) {
    const spec = specs.find(s => s.key === key && s.value)
    if (spec) {
      tags.push(spec.value)
      if (tags.length >= 3) break
    }
  }
  return tags
}

export function ListingCard({ listing, variant = 'default', className = '' }: ListingCardProps) {
  const t = useTranslations('components.listingCard')
  const conditionInfo = getConditionBadge(listing.condition)
  const sellerName = listing.seller_display_name || listing.seller_name
  const isCompact = variant === 'compact'
  const isGratis = Number(listing.price_chf) === 0
  const isVerified = !!listing.verified_at
  const specTags = getSpecTags(listing.specs)

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className={`group card-shell overflow-hidden hover:border-strong transition-all ${className}`}
    >
      {/* Image */}
      <div className={`relative ${isCompact ? 'aspect-square' : 'aspect-4/3'}`}>
        <ListingImage
          src={listing.thumbnail}
          alt={listing.title}
          fallbackIconSize={isCompact ? 'w-8 h-8' : 'w-12 h-12'}
        />

        {/* Condition Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
            {conditionInfo.label}
          </span>
        </div>

        {/* Verified Badge (top right) */}
        {isVerified && (
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${VERIFICATION_CONFIG.badge.color}`}>
              <ShieldCheck className="w-3 h-3" />
              {!isCompact && VERIFICATION_CONFIG.badge.shortLabel}
            </span>
          </div>
        )}

        {/* RevampIT Badge (top right, only if not verified — avoid overlap) */}
        {listing.is_revampit && !isVerified && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-action-muted-muted text-action">
              {!isCompact && ORG.name}
            </span>
          </div>
        )}

        {/* Gratis Badge (bottom left) */}
        {isGratis && (
          <div className="absolute bottom-2 left-2">
            <span className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full ${GRATIS_CONFIG.color}`}>
              {GRATIS_CONFIG.label}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className={isCompact ? 'p-2 md:p-3' : 'p-3 md:p-4'}>
        <Heading level={3} className={`font-semibold text-text-primary mb-1 line-clamp-2 ${isCompact ? 'text-xs md:text-sm' : 'text-sm md:text-base'} group-hover:text-action transition-colors`}>
          {listing.title}
        </Heading>

        <p className={`${isCompact ? 'text-base' : 'text-lg'} font-bold mb-1 ${isGratis ? 'text-teal-600' : 'text-text-primary'}`}>
          {formatCHF(Number(listing.price_chf))}
        </p>

        {/* Spec Tags */}
        {specTags.length > 0 && !isCompact && (
          <div className="flex flex-wrap gap-1 mb-2">
            {specTags.map((tag, idx) => (
              <span key={idx} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium rounded-sm bg-surface-raised text-text-secondary">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* CO₂ Badge — only on full-size cards, links to methodology page */}
        {!isCompact && listing.category && (
          <div className="mb-2">
            <CO2Badge category={listing.category} className="text-xs" />
          </div>
        )}

        {/* Seller Info */}
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span className="truncate">{sellerName}</span>
          {listing.seller_rating && Number(listing.seller_rating) > 0 && (
            <span className="inline-flex items-center gap-0.5 shrink-0">
              <Star className="w-3 h-3 text-warning-400 fill-warning-400" />
              {Number(listing.seller_rating).toFixed(1)}
            </span>
          )}
        </div>

        {/* Location */}
        {(listing.pickup_location || listing.seller_city) && (
          <div className="flex items-center gap-1 mt-1 text-xs text-text-tertiary">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{listing.pickup_location || listing.seller_city}</span>
          </div>
        )}

        {/* Stats */}
        {!isCompact && (
          <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
            <span>{listing.view_count} {t('views')}</span>
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
