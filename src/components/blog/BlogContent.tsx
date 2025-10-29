'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import BlogHero from '@/components/blog/BlogHero'
import BlogFeaturedGrid from '@/components/blog/BlogFeaturedGrid'
import BlogLatestList from '@/components/blog/BlogLatestList'
import BlogNavigation from '@/components/blog/BlogNavigation'

interface BlogContentProps {
  posts: BlogPost[]
}

export default function BlogContent({ posts }: BlogContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const allCategories = Array.from(
    new Set(posts.map((post) => post.category).filter(Boolean) as string[])
  ).sort()

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    if (!searchParams) return
    const categoriesParam = searchParams.get('categories')
    if (categoriesParam) {
      setSelectedCategories(categoriesParam.split(','))
    } else {
      setSelectedCategories([])
    }
  }, [searchParams])

  const handleCategoryChange = (category: string) => {
    if (!searchParams) return

    let newSelectedCategories: string[]

    if (selectedCategories.includes(category)) {
      newSelectedCategories = selectedCategories.filter((c) => c !== category)
    } else {
      newSelectedCategories = [...selectedCategories, category]
    }

    setSelectedCategories(newSelectedCategories)

    const params = new URLSearchParams(searchParams.toString())
    if (newSelectedCategories.length > 0) {
      params.set('categories', newSelectedCategories.join(','))
    } else {
      params.delete('categories')
    }
    router.push(`?${params.toString()}`)
  }

  const filteredPosts = selectedCategories.length > 0
    ? posts.filter((post) => post.category && selectedCategories.includes(post.category))
    : posts

  const [heroPost, ...restPosts] = filteredPosts
  const featuredPosts = restPosts.slice(0, 3)
  const latestPosts = restPosts.slice(3)

  // Only show navigation if there are more than 2 posts or more than 1 category
  const shouldShowNavigation = posts.length > 2 || allCategories.length > 1

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      {shouldShowNavigation && (
        <BlogNavigation
          categories={allCategories}
          selectedCategories={selectedCategories}
          onCategoryChange={handleCategoryChange}
        />
      )}

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple heading when navigation is hidden */}
        {!shouldShowNavigation && (
          <div className="pt-8 pb-4">
            <h1 className="text-3xl font-bold text-gray-900">Blog</h1>
          </div>
        )}
        
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Noch keine Artikel gefunden
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Versuchen Sie, Ihre Filter anzupassen oder reichen Sie einen Beitrag ein!
            </p>
            <Link
              href="/blog/submit"
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              Beitrag einreichen
            </Link>
          </div>
        ) : (
          <>
            {/* Hero Post */}
            {heroPost && (
              <div className="py-8">
                <BlogHero post={heroPost} />
              </div>
            )}

            {/* Featured Stories */}
            {featuredPosts.length > 0 && (
              <div className="py-8 border-t border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Stories</h2>
                <BlogFeaturedGrid posts={featuredPosts} />
              </div>
            )}

            {/* Latest Posts */}
            {latestPosts.length > 0 && (
              <div className="py-8 border-t border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Latest</h2>
                </div>
                <BlogLatestList posts={latestPosts} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="bg-gray-50 border-t border-gray-200 mt-16 py-12">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Teilen Sie Ihr Wissen
              </h3>
              <p className="text-gray-600">
                Haben Sie eine Geschichte über nachhaltige Technologie? Reichen Sie einen Beitrag ein.
              </p>
            </div>
            <Link
              href="/blog/submit"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold whitespace-nowrap"
            >
              Beitrag einreichen
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

