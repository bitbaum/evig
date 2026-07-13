/**
 * schema.org JSON-LD for a marketplace listing — Product + Offer (+ optional
 * AggregateRating) and a matching BreadcrumbList. Pure: all URLs/labels are
 * resolved by the caller (locale-aware) and passed in, so this stays testable
 * and free of framework/config coupling. Serialize with `safeJsonLd`.
 */

import type { ListingPublic, ListingReviewStats } from '@/lib/marketplace/listing-detail'
import { REVAMPIT_GUARANTEE } from '@/config/marketplace'

export interface ListingJsonLdContext {
  /** Absolute canonical URL of this listing. */
  listingUrl: string
  /** Absolute URL of the marketplace browse page. */
  marketplaceUrl: string
  /** Absolute URL of the category-filtered browse page. */
  categoryUrl: string
  /** Absolute site home URL. */
  homeUrl: string
  homeLabel: string
  marketplaceLabel: string
  categoryLabel: string
  orgName: string
}

// Our condition keys → schema.org condition enums.
const SCHEMA_CONDITION: Record<string, string> = {
  new: 'https://schema.org/NewCondition',
  like_new: 'https://schema.org/UsedCondition',
  good: 'https://schema.org/UsedCondition',
  fair: 'https://schema.org/UsedCondition',
  poor: 'https://schema.org/UsedCondition',
  defect: 'https://schema.org/DamagedCondition',
}

// Listing status → schema.org availability.
const SCHEMA_AVAILABILITY: Record<string, string> = {
  active: 'https://schema.org/InStock',
  reserved: 'https://schema.org/OutOfStock',
  sold: 'https://schema.org/SoldOut',
  draft: 'https://schema.org/OutOfStock',
}

export function buildListingJsonLd(
  listing: ListingPublic,
  reviewStats: ListingReviewStats,
  ctx: ListingJsonLdContext,
): object[] {
  const images = listing.images.map((i) => i.url).filter(Boolean)
  const sellerName = listing.seller_display_name || listing.seller_name || ctx.orgName

  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    url: ctx.listingUrl,
    priceCurrency: 'CHF',
    price: listing.price_chf,
    itemCondition: SCHEMA_CONDITION[listing.condition] ?? 'https://schema.org/UsedCondition',
    availability: SCHEMA_AVAILABILITY[listing.status] ?? 'https://schema.org/InStock',
    seller: {
      '@type': listing.is_revampit ? 'Organization' : 'Person',
      name: sellerName,
    },
    // RevampIT refurbished stock carries the org's stated warranty + return
    // policy (config SSOT). P2P listings make no such promise (AGB §6).
    ...(listing.is_revampit
      ? {
          warranty: {
            '@type': 'WarrantyPromise',
            durationOfWarranty: {
              '@type': 'QuantitativeValue',
              value: REVAMPIT_GUARANTEE.warrantyMonths,
              unitCode: 'MON',
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'CH',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: REVAMPIT_GUARANTEE.returnDays,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn',
          },
        }
      : {}),
  }

  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    sku: listing.id,
    category: ctx.categoryLabel,
    ...(images.length > 0 ? { image: images } : {}),
    ...(listing.brand ? { brand: { '@type': 'Brand', name: listing.brand } } : {}),
    ...(listing.model ? { model: listing.model } : {}),
    offers: offer,
    ...(reviewStats.count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: reviewStats.average,
            reviewCount: reviewStats.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: ctx.homeLabel, item: ctx.homeUrl },
      { '@type': 'ListItem', position: 2, name: ctx.marketplaceLabel, item: ctx.marketplaceUrl },
      { '@type': 'ListItem', position: 3, name: ctx.categoryLabel, item: ctx.categoryUrl },
      { '@type': 'ListItem', position: 4, name: listing.title, item: ctx.listingUrl },
    ],
  }

  return [product, breadcrumb]
}
