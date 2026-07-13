import { buildListingJsonLd, type ListingJsonLdContext } from '../listing-json-ld'
import type { ListingPublic, ListingReviewStats } from '@/lib/marketplace/listing-detail'

const CTX: ListingJsonLdContext = {
  listingUrl: 'https://x.ch/de/marketplace/l1',
  marketplaceUrl: 'https://x.ch/de/marketplace',
  categoryUrl: 'https://x.ch/de/marketplace?category=10',
  homeUrl: 'https://x.ch/de',
  homeLabel: 'Home',
  marketplaceLabel: 'Marktplatz',
  categoryLabel: 'Laptops',
  orgName: 'Revamp-IT',
}

function makeListing(overrides: Partial<ListingPublic> = {}): ListingPublic {
  return {
    id: 'l1',
    seller_id: 's1',
    title: 'ThinkPad X260',
    description: 'Solides Business-Notebook',
    price_chf: 199,
    category: '10',
    condition: 'good',
    brand: 'Lenovo',
    model: 'X260',
    delivery_options: 'both',
    shipping_cost_chf: 9,
    pickup_location: 'Zürich',
    payment_mode: 'direct',
    status: 'active',
    is_revampit: false,
    view_count: 3,
    favorite_count: 1,
    created_at: '2026-01-01T00:00:00Z',
    seller_name: 'Anna',
    seller_display_name: null,
    seller_bio: null,
    seller_avatar_url: null,
    seller_city: 'Zürich',
    seller_canton: 'ZH',
    seller_rating: null,
    seller_total_sold: null,
    seller_total_reviews: null,
    images: [{ id: 'i1', url: 'https://x.ch/a.jpg', position: 0, is_primary: true }],
    verified_at: null,
    verified_by: null,
    verification_notes: null,
    condition_checks: null,
    specs: null,
    ...overrides,
  }
}

const noReviews: ListingReviewStats = { average: 0, count: 0 }

describe('buildListingJsonLd', () => {
  it('emits a Product with an Offer and a BreadcrumbList', () => {
    const [product, breadcrumb] = buildListingJsonLd(makeListing(), noReviews, CTX) as [
      Record<string, unknown>,
      Record<string, unknown>,
    ]
    expect(product['@type']).toBe('Product')
    expect(product.name).toBe('ThinkPad X260')
    expect(product.image).toEqual(['https://x.ch/a.jpg'])
    expect(product.brand).toEqual({ '@type': 'Brand', name: 'Lenovo' })
    const offer = product.offers as Record<string, unknown>
    expect(offer.price).toBe(199)
    expect(offer.priceCurrency).toBe('CHF')
    expect(offer.itemCondition).toBe('https://schema.org/UsedCondition')
    expect(offer.availability).toBe('https://schema.org/InStock')
    expect((offer.seller as Record<string, unknown>)['@type']).toBe('Person')
    expect(breadcrumb['@type']).toBe('BreadcrumbList')
    expect((breadcrumb.itemListElement as unknown[]).length).toBe(4)
  })

  it('omits AggregateRating when there are no reviews, includes it otherwise', () => {
    const [without] = buildListingJsonLd(makeListing(), noReviews, CTX) as [Record<string, unknown>]
    expect(without.aggregateRating).toBeUndefined()

    const [withRating] = buildListingJsonLd(makeListing(), { average: 4.5, count: 8 }, CTX) as [
      Record<string, unknown>,
    ]
    expect(withRating.aggregateRating).toMatchObject({
      '@type': 'AggregateRating',
      ratingValue: 4.5,
      reviewCount: 8,
    })
  })

  it('maps condition + status to schema.org enums and marks RevampIT seller as Organization', () => {
    const [product] = buildListingJsonLd(
      makeListing({ condition: 'new', status: 'sold', is_revampit: true }),
      noReviews,
      CTX,
    ) as [Record<string, unknown>]
    const offer = product.offers as Record<string, unknown>
    expect(offer.itemCondition).toBe('https://schema.org/NewCondition')
    expect(offer.availability).toBe('https://schema.org/SoldOut')
    expect((offer.seller as Record<string, unknown>)['@type']).toBe('Organization')
  })
})
