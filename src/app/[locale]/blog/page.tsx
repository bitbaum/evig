// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Suspense } from 'react'
import { BookOpen, X } from 'lucide-react'
import { getAllCategories, type BlogCategory } from '@/lib/blog-db'
import { isListedPost } from '@/lib/blog'
import { filterViewable, type BlogViewer } from '@/lib/blog-access'
import { getMergedPosts } from '@/lib/blog-merge'
import { paginateBlogIndex, slugifyCategory } from '@/lib/blog-utils'
import { BLOG_PAGE_SIZE } from '@/config/blog'
import { auth } from '@/auth'
import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedGrid from '@/components/blog/BlogFeaturedGrid'
import BlogLatestList from '@/components/blog/BlogLatestList'
import BlogNavigationClient from '@/components/blog/BlogNavigationClient'
import NewsletterSignup from '@/components/blog/NewsletterSignup'
import Heading from '@/components/ui/Heading'
import { Pagination } from '@/components/ui/Pagination'
import { buttonClass } from '@/components/ui/button-class'
import { PageHero } from '@/components/layout/PageHero'
import { getTranslations, getLocale } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  const title = t('meta.title')
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    // Make the (already-working) RSS feed discoverable to feed readers.
    alternates: {
      types: { 'application/rss+xml': '/feed.xml' },
    },
  }
}

// Revalidate every 60 seconds to show new posts
export const revalidate = 60

interface BlogPageProps {
  searchParams: Promise<{ categories?: string; q?: string; tag?: string; page?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const t = await getTranslations('blog')
  const { categories, q, tag, page } = await searchParams

  // Unified read layer: DB posts (admin UI) + git file posts (locale-aware),
  // deduped by slug. Everything shows regardless of where it was authored.
  const locale = await getLocale()
  let allPosts = await getMergedPosts(locale)

  // Access control (audience) is decided first: strip any post this viewer may
  // not load at all (team-only, author-only) before discoverability filtering.
  const session = await auth()
  const viewer: BlogViewer | null = session?.user
    ? {
        userId: session.user.id,
        isStaff: session.user.isStaff,
        email: session.user.email,
        isSuperAdmin: session.user.isSuperAdmin,
      }
    : null
  allPosts = filterViewable(allPosts, viewer)

  // Unlisted posts stay out of the public listing, but logged-in staff see them
  // (with a badge) so they can grab the link to share. Direct links stay open.
  const isStaff = Boolean(session?.user?.isStaff)
  if (!isStaff) {
    allPosts = allPosts.filter(isListedPost)
  }

  // Fetch categories from DB (with colors and descriptions)
  const dbCategories = await getAllCategories()

  // Build category objects - merge DB categories with any categories found in posts
  const postCategoryNames = new Set(
    allPosts.map((post) => post.category).filter(Boolean) as string[]
  )

  // Create a map of DB categories by name for quick lookup
  const dbCategoryMap = new Map(dbCategories.map(c => [c.name, c]))

  // Build final categories list: DB categories that have posts + any post categories not in DB
  const allCategories: BlogCategory[] = []

  // First add DB categories that have posts
  for (const dbCat of dbCategories) {
    if (postCategoryNames.has(dbCat.name)) {
      allCategories.push(dbCat)
    }
  }

  // Then add any post categories not in DB (with default styling)
  for (const catName of postCategoryNames) {
    if (!dbCategoryMap.has(catName)) {
      allCategories.push({
        id: catName,
        slug: slugifyCategory(catName),
        name: catName,
        description: null,
        color: null,
        isActive: true,
      })
    }
  }

  // Sort alphabetically
  allCategories.sort((a, b) => a.name.localeCompare(b.name))

  const selectedCategorySlugs = categories
    ? categories.split(',').filter(Boolean)
    : []

  // Map slugs back to names for filtering
  const selectedCategoryNames = selectedCategorySlugs
    .map(slug => allCategories.find(c => c.slug === slug)?.name)
    .filter(Boolean) as string[]

  let filteredPosts = selectedCategoryNames.length > 0
    ? allPosts.filter((post) => post.category && selectedCategoryNames.includes(post.category))
    : allPosts

  // Tag filter (post tag pills link here) — exact, case-insensitive match.
  const activeTag = (tag || '').trim()
  if (activeTag) {
    const needle = activeTag.toLowerCase()
    filteredPosts = filteredPosts.filter((post) =>
      post.tags?.some((tg) => tg.toLowerCase() === needle)
    )
  }

  // Search — simple server-side match over title/excerpt/tags. With the current
  // post volume this beats wiring a search engine (YAGNI); revisit at ~100+ posts.
  const query = (q || '').trim()
  if (query) {
    const needle = query.toLowerCase()
    filteredPosts = filteredPosts.filter((post) =>
      post.title.toLowerCase().includes(needle) ||
      (post.excerpt || '').toLowerCase().includes(needle) ||
      post.tags?.some((tg) => tg.toLowerCase().includes(needle))
    )
  }

  // Search/tag results read as a flat list; the magazine layout (hero +
  // featured) only makes sense for browsing, not for "show me what matched".
  const flatMode = Boolean(query || activeTag)
  const requestedPage = Number.parseInt(page || '1', 10) || 1

  let heroPost = null
  let featuredPosts: typeof filteredPosts = []
  let latestPosts: typeof filteredPosts = []
  let currentPage = 1
  let totalPages = 1
  let totalItems = 0

  if (flatMode) {
    totalItems = filteredPosts.length
    totalPages = Math.max(1, Math.ceil(totalItems / BLOG_PAGE_SIZE))
    currentPage = Math.min(Math.max(1, requestedPage), totalPages)
    latestPosts = filteredPosts.slice((currentPage - 1) * BLOG_PAGE_SIZE, currentPage * BLOG_PAGE_SIZE)
  } else {
    const paged = paginateBlogIndex(filteredPosts, requestedPage, BLOG_PAGE_SIZE)
    heroPost = paged.heroPost
    featuredPosts = paged.featuredPosts
    latestPosts = paged.latestPosts
    currentPage = paged.currentPage
    totalPages = paged.totalPages
    totalItems = paged.latestTotal
  }

  // Pagination links must preserve the active filters.
  const hrefParams = new URLSearchParams()
  if (categories) hrefParams.set('categories', categories)
  if (query) hrefParams.set('q', query)
  if (activeTag) hrefParams.set('tag', activeTag)
  const hrefQs = hrefParams.toString()
  const hrefBase = hrefQs ? `/blog?${hrefQs}` : '/blog'

  // "Clear this filter" target keeps the other filters intact.
  const clearParams = new URLSearchParams(hrefParams)
  clearParams.delete('q')
  clearParams.delete('tag')
  const clearQs = clearParams.toString()
  const clearHref = clearQs ? `/blog?${clearQs}` : '/blog'

  return (
    <main>
      <PageHero
        theme="blog"
        icon={BookOpen}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Navigation */}
      <Suspense fallback={
        <nav className="border-b border bg-surface-base sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <span className="text-xl sm:text-2xl font-bold text-text-primary">{t('hero.title')}</span>
            </div>
          </div>
        </nav>
      }>
        <BlogNavigationClient
          categories={allCategories}
          selectedCategorySlugs={selectedCategorySlugs}
          searchQuery={query}
        />
      </Suspense>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Active search / tag filter feedback */}
        {flatMode && (
          <div className="flex flex-wrap items-center gap-3 pt-6 sm:pt-8">
            <Heading level={2} className="text-text-primary">
              {query
                ? t('filter.resultsFor', { query })
                : t('filter.tagged', { tag: activeTag })}
            </Heading>
            <span className="font-mono text-sm text-text-tertiary">
              {t('filter.count', { count: totalItems })}
            </span>
            <Link
              href={clearHref}
              className="inline-flex min-h-11 items-center gap-1 rounded-full border border-subtle px-3 text-sm text-text-secondary transition-colors hover:border-strong hover:text-text-primary"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t('filter.clear')}
            </Link>
          </div>
        )}

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <Heading level={2} className="text-text-primary mb-4">
              {t('empty.title')}
            </Heading>
            <p className="text-sm sm:text-base text-text-secondary mb-6 sm:mb-8">
              {t('empty.description')}
            </p>
            <Link href="/blog/submit" className={buttonClass({ variant: 'primary' })}>
              {t('empty.submitButton')}
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Post */}
            {heroPost && (
              <div className="py-6 sm:py-8">
                <BlogHero post={heroPost} />
              </div>
            )}

            {/* Featured Stories */}
            {featuredPosts.length > 0 && (
              <div className="py-6 sm:py-8 border-t border">
                <Heading level={2} className="text-text-primary mb-4 sm:mb-6">{t('sections.featured')}</Heading>
                <BlogFeaturedGrid posts={featuredPosts} />
              </div>
            )}

            {/* Latest Posts */}
            {latestPosts.length > 0 && (
              <div className={flatMode ? 'py-6 sm:py-8' : 'py-6 sm:py-8 border-t border'}>
                {!flatMode && (
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <Heading level={2} className="text-text-primary">{t('sections.latest')}</Heading>
                  </div>
                )}
                <BlogLatestList posts={latestPosts} />
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pb-8 pt-2">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={BLOG_PAGE_SIZE}
                  hrefBase={hrefBase}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter */}
      <NewsletterSignup />

      {/* Footer CTA */}
      <div className="ui-public-band mt-12 sm:mt-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div>
              <h3 className="ui-public-display-md">
                {t('footerCta.title')}
              </h3>
              <p className="ui-public-section-lede mt-2">
                {t('footerCta.description')}
              </p>
            </div>
            <Link
              href="/blog/submit"
              className="ui-public-cta whitespace-nowrap"
            >
              {t('footerCta.button')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
