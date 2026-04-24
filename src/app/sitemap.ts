import type { MetadataRoute } from 'next'
import { db } from '@/db'
import { blogPosts, workshops, aiExtractedProducts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { locales, defaultLocale } from '@/i18n/routing'
import { APP_URL } from '@/config/urls'
import { OSS_ALTERNATIVES } from '@/config/open-source-registry'
import { logger } from '@/lib/logger'

const BASE = APP_URL

/** Build a localized URL. Default locale (de) has no prefix. */
function url(path: string, locale: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  return `${BASE}${prefix}${path}`
}

/** Expand a path to all locale variants */
function allLocales(path: string, priority = 0.6, changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] = 'monthly'): MetadataRoute.Sitemap {
  return locales.map(locale => ({
    url: url(path, locale),
    changeFrequency,
    priority,
  }))
}

// Static public pages — excludes /auth/*, /dashboard/*, /admin/*, /inventory/*
const STATIC_PAGES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[0]['changeFrequency'] }> = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/marketplace', priority: 0.9, changeFrequency: 'daily' },
  { path: '/workshops', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/open-source-solutions', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/services/hardware-recycling', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services/linux-open-source', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/services/build-your-computer', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/it-hilfe', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/it-hilfe/create', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/techniker', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/get-involved', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/get-involved/volunteer', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/internships', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/partnerships', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/technical-experts', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/work-reintegration', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/get-involved/donate', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/get-involved/kontakt', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/mitglied-werden', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/abos', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/projects', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/revamped', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/space', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/knowhow', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/transparenz', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/marketplace/sell', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/workshops/propose', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/blog/submit', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/agb', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/datenschutz', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/impressum', priority: 0.3, changeFrequency: 'yearly' },
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
  const ossEntries = OSS_ALTERNATIVES.flatMap(alt =>
    locales.map(locale => ({
      url: url(`/services/open-source-solutions/${alt.id}`, locale),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )
  entries.push(...ossEntries)

  // 3. Published blog posts
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

  // 4. Active workshops
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

  // 5. Shop products (approved, visible in shop)
  try {
    const products = await db
      .select({ id: aiExtractedProducts.id, updatedAt: aiExtractedProducts.updatedAt })
      .from(aiExtractedProducts)
      .where(eq(aiExtractedProducts.status, 'approved'))

    for (const product of products) {
      for (const locale of locales) {
        entries.push({
          url: url(`/shop/product/${product.id}`, locale),
          lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.6,
        })
      }
    }
  } catch (error) {
    logger.error('Sitemap: failed to fetch shop products', { error })
  }

  return entries
}
