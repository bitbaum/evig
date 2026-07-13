import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ChevronRight, Home } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { auth } from '@/auth'
import { APP_URL } from '@/config/urls'
import { ORG } from '@/config/org'
import { getCategoryLabel, LISTING_STATUS } from '@/config/marketplace'
import { safeJsonLd } from '@/lib/seo/json-ld'
import { buildListingJsonLd } from '@/lib/seo/listing-json-ld'
import {
  getListingDetail,
  getListingReviewStats,
  isListingFavorited,
  incrementListingView,
} from '@/lib/marketplace/listing-detail'
import { ListingDetailClient } from './ListingDetailClient'

type PageParams = { locale: string; id: string }

/**
 * Per-listing SEO. Runs server-side and shares the cached `getListingDetail`
 * fetch with the page body (one DB round-trip). Non-ACTIVE/SOLD listings are
 * marked noindex so drafts/reserved pages don't leak into search.
 */
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { locale, id } = await params
  const listing = await getListingDetail(id)
  if (!listing) return {}

  const url = `${APP_URL}/${locale}/marketplace/${id}`
  const image = listing.images.find((i) => i.url)?.url
  const description = (listing.description || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  const indexable = listing.status === LISTING_STATUS.ACTIVE || listing.status === LISTING_STATUS.SOLD

  return {
    title: listing.title,
    description,
    alternates: { canonical: url },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
    openGraph: {
      type: 'website',
      title: listing.title,
      description,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<PageParams> }) {
  const { locale, id } = await params
  const listing = await getListingDetail(id)
  if (!listing) notFound()

  const session = await auth()
  const [reviewStats, isFavorited] = await Promise.all([
    getListingReviewStats(id),
    session?.user?.id ? isListingFavorited(session.user.id, id) : Promise.resolve(false),
  ])
  // The server render IS the page view; the client island no longer refetches.
  incrementListingView(id)

  const tb = await getTranslations('components.breadcrumbs')
  const categoryLabel = getCategoryLabel(listing.category)
  const categoryQuery = `/marketplace?category=${encodeURIComponent(listing.category)}`

  const jsonLd = buildListingJsonLd(listing, reviewStats, {
    listingUrl: `${APP_URL}/${locale}/marketplace/${id}`,
    marketplaceUrl: `${APP_URL}/${locale}/marketplace`,
    categoryUrl: `${APP_URL}/${locale}${categoryQuery}`,
    homeUrl: `${APP_URL}/${locale}`,
    homeLabel: tb('home'),
    marketplaceLabel: tb('marketplace'),
    categoryLabel,
    orgName: ORG.name,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* Breadcrumb trail — mirrors the BreadcrumbList JSON-LD above. */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-text-tertiary">
          <li>
            <Link href="/" className="flex items-center gap-1 hover:text-text-primary transition-colors">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{tb('home')}</span>
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden="true" />
            <Link href="/marketplace" className="hover:text-text-primary transition-colors">
              {tb('marketplace')}
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden="true" />
            <Link href={categoryQuery} className="hover:text-text-primary transition-colors truncate max-w-[160px]">
              {categoryLabel}
            </Link>
          </li>
          <li className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" aria-hidden="true" />
            <span className="font-medium text-text-primary truncate max-w-[240px]" aria-current="page">
              {listing.title}
            </span>
          </li>
        </ol>
      </nav>

      <ListingDetailClient listing={{ ...listing, is_favorited: isFavorited }} />
    </div>
  )
}
