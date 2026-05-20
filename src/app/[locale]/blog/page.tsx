// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Suspense } from 'react'
import { BookOpen } from 'lucide-react'
import { getAllPosts, getAllCategories, type BlogCategory } from '@/lib/blog-db'
import { getAllPosts as getFilePosts } from '@/lib/blog'
import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedGrid from '@/components/blog/BlogFeaturedGrid'
import BlogLatestList from '@/components/blog/BlogLatestList'
import BlogNavigationClient from '@/components/blog/BlogNavigationClient'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/layout/PageHero'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'blog' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

// Revalidate every 60 seconds to show new posts
export const revalidate = 60

interface BlogPageProps {
  searchParams: Promise<{ categories?: string }>
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const t = await getTranslations('blog')
  const { categories } = await searchParams

  // Try database first, fall back to file system if no posts in DB
  let allPosts = await getAllPosts()
  if (allPosts.length === 0) {
    allPosts = getFilePosts()
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
        slug: catName.toLowerCase().replace(/\s+/g, '-'),
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

  const filteredPosts = selectedCategoryNames.length > 0
    ? allPosts.filter((post) => post.category && selectedCategoryNames.includes(post.category))
    : allPosts

  const [heroPost, ...restPosts] = filteredPosts
  const featuredPosts = restPosts.slice(0, 3)
  const latestPosts = restPosts.slice(3)

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
        <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900">{t('hero.title')}</span>
            </div>
          </div>
        </nav>
      }>
        <BlogNavigationClient
          categories={allCategories}
          selectedCategorySlugs={selectedCategorySlugs}
        />
      </Suspense>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 sm:py-16 md:py-20">
            <Heading level={2} className="text-neutral-900 mb-4">
              {t('empty.title')}
            </Heading>
            <p className="text-sm sm:text-base text-neutral-600 mb-6 sm:mb-8">
              {t('empty.description')}
            </p>
            <Button as={Link} href="/blog/submit" variant="primary">
              {t('empty.submitButton')}
            </Button>
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
              <div className="py-6 sm:py-8 border-t border-neutral-200">
                <Heading level={2} className="text-neutral-900 mb-4 sm:mb-6">{t('sections.featured')}</Heading>
                <BlogFeaturedGrid posts={featuredPosts} />
              </div>
            )}

            {/* Latest Posts */}
            {latestPosts.length > 0 && (
              <div className="py-6 sm:py-8 border-t border-neutral-200">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <Heading level={2} className="text-neutral-900">{t('sections.latest')}</Heading>
                </div>
                <BlogLatestList posts={latestPosts} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-neutral-50 border-t border-neutral-200 mt-12 sm:mt-16 py-8 sm:py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div>
              <Heading level={3} className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
                {t('footerCta.title')}
              </Heading>
              <p className="text-sm sm:text-base text-neutral-600">
                {t('footerCta.description')}
              </p>
            </div>
            <Button as={Link} href="/blog/submit" variant="primary" className="whitespace-nowrap">
              {t('footerCta.button')}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
