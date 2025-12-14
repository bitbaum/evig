'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BlogNavigationClientProps {
  categories: string[]
  selectedCategories: string[]
}

export default function BlogNavigationClient({
  categories,
  selectedCategories,
}: BlogNavigationClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentCategories = params.get('categories')?.split(',').filter(Boolean) || []
    
    let newCategories: string[]
    if (currentCategories.includes(category)) {
      newCategories = currentCategories.filter((c) => c !== category)
    } else {
      newCategories = [...currentCategories, category]
    }

    if (newCategories.length > 0) {
      params.set('categories', newCategories.join(','))
    } else {
      params.delete('categories')
    }
    router.push(`/blog?${params.toString()}`)
  }

  const handleClearFilters = () => {
    router.push('/blog')
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Title */}
          <Link href="/blog" className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Blog</h1>
          </Link>

          {/* Categories */}
          <div className="hidden md:flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={handleClearFilters}
              className={cn(
                "text-xs sm:text-sm font-medium transition-colors",
                selectedCategories.length === 0
                  ? "text-green-600 font-bold"
                  : "text-gray-700 hover:text-green-600"
              )}
            >
              Alle
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={cn(
                  "text-xs sm:text-sm font-medium transition-colors",
                  selectedCategories.includes(category)
                    ? "text-green-600 font-bold"
                    : "text-gray-700 hover:text-green-600"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/blog/submit"
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-semibold"
          >
            Beitrag einreichen
          </Link>
        </div>
      </div>
    </nav>
  )
}












