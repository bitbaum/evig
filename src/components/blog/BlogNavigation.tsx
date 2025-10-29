import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BlogNavigationProps {
  categories: string[]
  selectedCategories: string[]
  onCategoryChange: (category: string) => void
}

export default function BlogNavigation({
  categories,
  selectedCategories,
  onCategoryChange,
}: BlogNavigationProps) {
  const router = useRouter()

  const handleClearFilters = () => {
    router.push('/blog')
  }

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href="/blog" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          </Link>

          {/* Categories */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleClearFilters}
              className={cn(
                "text-sm font-medium transition-colors",
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
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "text-sm font-medium transition-colors",
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
          >
            Beitrag einreichen
          </Link>
        </div>
      </div>
    </nav>
  )
}
