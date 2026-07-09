import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { blogPosts, workshops, listings, sellerProfiles } from '@/db/schema'
import { eq, gt } from 'drizzle-orm'
import { locales, defaultLocale } from '@/i18n/routing'
import { APP_URL } from '@/config/urls'
import { ROUTES } from '@/config/routes'
import { OSS_ALTERNATIVES } from '@/config/open-source-registry'
import { LISTING_STATUS } from '@/config/marketplace'
import { SERVICE_CONFIGS } from '@/app/[locale]/services/data'
import { logger } from '@/lib/logger'

const BASE = APP_URL
const R = ROUTES.public

/** Build a localized URL. Default locale (de) has no prefix. */
function url(path: string, locale: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  return `${BASE}${prefix}${path}`
}

/**
 * Static public pages. Paths that already live in `ROUTES.public` are
 * pulled from there (single edit-point if a route is renamed). Paths
 * that exist nowhere else are inlined — adding them to ROUTES.public
 * for a one-call use-site is over-engineering.
 */
const STATIC_PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }> = [
  { path: R.home,                                     priority: 1.0, changeFrequency: 'daily' },
  { path: R.marketplace,                              priority: 0.9, changeFrequency: 'daily' },
  { path: R.workshops,                                priority: 0.8, changeFrequency: 'weekly' },
  { path: R.blog,                                     priority: 0.8, changeFrequency: 'daily' },
  { path: '/services',                                priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/open-source-solutions',          priority: 0.8, changeFrequency: 'monthly' },
  { path: R.itHilfe,                                  priority: 0.8, changeFrequency: 'weekly' },
  { path: R.itHilfeCreate,                            priority: 0.6, changeFrequency: 'monthly' },
  { path: R.techniker,                                priority: 0.7, changeFrequency: 'weekly' },
  { path: '/get-involved',                            priority: 0.7, changeFrequency: 'monthly' },
  { path: '/get-involved/volunteer',                  priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/internships',                priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/partnerships',               priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/technical-experts',          priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/work-reintegration',         priority: 0.6, changeFrequency: 'monthly' },
  { path: R.donate,                                   priority: 0.7, changeFrequency: 'monthly' },
  { path: '/get-involved/kontakt',                    priority: 0.6, changeFrequency: 'monthly' },
  { path: R.mitgliedWerden,                           priority: 0.7, changeFrequency: 'monthly' },
  { path: '/abos',                                    priority: 0.6, changeFrequency: 'monthly' },
  { path: '/projects',                                priority: 0.6, changeFrequency: 'monthly' },
  { path: '/revamped',                                priority: 0.6, changeFrequency: 'monthly' },
  { path: '/space',                                   priority: 0.6, changeFrequency: 'monthly' },
  { path: '/knowhow',                                 priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact',                                 priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq',                                     priority: 0.6, changeFrequency: 'monthly' },
  { path: R.transparenz,                              priority: 0.5, changeFrequency: 'monthly' },
  { path: R.marketplaceSell,                          priority: 0.6, changeFrequency: 'monthly' },
  { path: R.workshopsPropose,                         priority: 0.5, changeFrequency: 'monthly' },
  { path: R.blogSubmit,                               priority: 0.5, changeFrequency: 'monthly' },
  { path: R.agb,                                      priority: 0.3, changeFrequency: 'yearly' },
  { path: R.datenschutz,                              priority: 0.3, changeFrequency: 'yearly' },
  { path: R.impressum,                                priority: 0.3, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // 1. Static pages × all locales
  for (const page of STATIC_PAGES) {
    for (const locale of locales) {
      entries.push({
        url: url(page.path, locale),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  // 2. Open-source alternatives (config-driven, same for all locales)
  for (const alt of OSS_ALTERNATIVES) {
    for (const locale of locales) {
      entries.push({
        url: url(`/services/open-source-solutions/${alt.id}`, locale),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  // 3. Individual service pages (derived from SERVICE_CONFIGS — auto-updates when new services added)
  for (const service of SERVICE_CONFIGS) {
    // Skip the open-source-solutions listing (handled above with its own entries per-alt)
    if (service.href === '/services/open-source-solutions') continue
    for (const locale of locales) {
      entries.push({
        url: url(service.href, locale),
        changeFrequency: 'monthly',
        priority: 0.7,
      })
    }
  }

  // 5. Published blog posts
  try {
    const posts = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))

    for (const post of posts) {
      for (const locale of locales) {
        entries.push({
          url: url(`/blog/${post.slug}`, locale),
          lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    logger.error('Sitemap: failed to fetch blog posts', { error })
  }

  // 6. Active workshops
  try {
    const activeWorkshops = await db
      .select({ slug: workshops.slug, updatedAt: workshops.updatedAt })
      .from(workshops)
      .where(eq(workshops.isActive, true))

    for (const workshop of activeWorkshops) {
      for (const locale of locales) {
        entries.push({
          url: url(`/workshops/${workshop.slug}`, locale),
          lastModified: workshop.updatedAt ? new Date(workshop.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    logger.error('Sitemap: failed to fetch workshops', { error })
  }

  // 7. Active marketplace listings — canonical online shop inventory.
  try {
    const activeListings = await db
      .select({ id: listings.id, updatedAt: listings.updatedAt })
      .from(listings)
      .where(eq(listings.status, LISTING_STATUS.ACTIVE))

    for (const listing of activeListings) {
      for (const locale of locales) {
        entries.push({
          url: url(`/marketplace/${listing.id}`, locale),
          lastModified: listing.updatedAt ? new Date(listing.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch (error) {
    logger.error('Sitemap: failed to fetch marketplace listings', { error })
  }

  // 9. Seller profiles with at least 1 active listing
  try {
    const activeSellers = await db
      .select({ userId: sellerProfiles.userId, updatedAt: sellerProfiles.updatedAt })
      .from(sellerProfiles)
      .where(gt(sellerProfiles.totalListings, 0))

    for (const seller of activeSellers) {
      for (const locale of locales) {
        entries.push({
          url: url(`/sellers/${seller.userId}`, locale),
          lastModified: seller.updatedAt ? new Date(seller.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.5,
        })
      }
    }
  } catch (error) {
    logger.error('Sitemap: failed to fetch seller profiles', { error })
  }

  return entries
}
