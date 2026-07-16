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

import { type MouseEvent } from 'react'
import { ShoppingCart, Check, BadgeCheck } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { normalizeConditionValue, ZUSTAND_OPTIONS } from '@/config/erfassung/conditions'
import { formatCHF } from '@/config/marketplace'
import { Button } from '@/components/ui/button'
import { ListingImage } from './ListingImage'
import { CO2Badge } from './CO2Badge'
import { useCart } from './cart/CartProvider'
import { ORG } from '@/config/org'

const CANONICAL_CONDITION_VALUES = new Set(ZUSTAND_OPTIONS.map(o => o.value))

export interface ListingCardData {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  is_revampit: boolean
  pickup_location: string | null
  seller_name: string
  seller_display_name: string | null
  seller_rating: number | null
  seller_city: string | null
  seller_is_verified?: boolean | null
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
  const t = useTranslations('marketplace')
  const sellerName = listing.seller_display_name || listing.seller_name
  const isCompact = variant === 'compact'
  const isGratis = Number(listing.price_chf) === 0
  const isVerified = !!listing.verified_at
  const conditionKey = normalizeConditionValue(listing.condition)
  const conditionLabel = CANONICAL_CONDITION_VALUES.has(conditionKey)
    ? t(`conditions.${conditionKey}` as never)
    : null

  // Eyebrow = monochrome meta line. Order: source (RevampIT vs P2P) ·
  // condition · verified. Pure text, no chrome.
  const eyebrowParts = [
    listing.is_revampit ? ORG.name : null,
    conditionLabel?.toUpperCase() ?? null,
    isVerified ? t('listing.verified').toUpperCase() : null,
  ].filter(Boolean) as string[]

  const location = listing.pickup_location || listing.seller_city
  // RevampIT stock is cart-eligible; community P2P listings stay direct-buy.
  const showQuickAdd = listing.is_revampit && !isCompact && !isGratis

  return (
    // Container is the positioning context for the stretched link, so a real
    // add-to-cart button can sit above it (valid HTML — no <button> in <a>).
    <div className={`group card-shell relative overflow-hidden hover:border-strong transition-colors ${className}`}>
      <Link
        href={`/marketplace/${listing.id}`}
        className="block after:absolute after:inset-0 after:content-['']"
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
            {isGratis ? t('listing.free').toUpperCase() : formatCHF(Number(listing.price_chf))}
          </div>

          {/* Sustainability signal — the mission in one line. Self-hides when the
              category has no defensible estimate (config SSOT). */}
          <CO2Badge category={listing.category} compact className="mt-2" />

          <div className="mt-3 pt-3 border-t border-subtle font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary flex items-center gap-1 min-w-0">
            <span className="truncate">
              {sellerName}
              {location && <> · {location}</>}
            </span>
            {listing.seller_is_verified && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 text-action"
                aria-label={t('listing.sellerVerified')}
              />
            )}
          </div>
        </div>
      </Link>

      {showQuickAdd && (
        <div className="relative z-[1] px-4 pb-4">
          <CardQuickAdd listing={listing} />
        </div>
      )}
    </div>
  )
}

/** Compact add-to-cart for RevampIT browse cards. Stops link navigation. */
function CardQuickAdd({ listing }: { listing: ListingCardData }) {
  const t = useTranslations('marketplace.cart')
  const { has, add, openDrawer } = useCart()
  const inCart = has(listing.id)

  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!inCart) {
      add({
        id: listing.id,
        title: listing.title,
        priceChf: Number(listing.price_chf),
        thumbnail: listing.thumbnail,
        category: listing.category,
        condition: listing.condition,
      })
    }
    openDrawer()
  }

  return (
    <Button onClick={handleClick} variant={inCart ? 'outline' : 'primary'} size="sm" className="w-full gap-2">
      {inCart ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
      {inCart ? t('inCart') : t('addToCart')}
    </Button>
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
