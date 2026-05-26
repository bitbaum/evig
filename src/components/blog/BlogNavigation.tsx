import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-class'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { ROUTES } from '@/config/routes'

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
    router.push(ROUTES.public.blog)
  }

  return (
    <nav className="border-b border-neutral-200 bg-white sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <Link href={ROUTES.public.blog} className="flex items-center">
            <Heading level={1} className="text-2xl font-bold text-neutral-900">Blog</Heading>
          </Link>

          {/* Categories */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleClearFilters}
              className={cn(
                "text-sm font-medium transition-colors",
                selectedCategories.length === 0
                  ? "text-primary-600 font-bold"
                  : "text-neutral-700 hover:text-primary-600"
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
                    ? "text-primary-600 font-bold"
                    : "text-neutral-700 hover:text-primary-600"
                )}
              >
                {category}
              </button>
            ))}
          </div>

          {/* CTA */}
          <Link href={ROUTES.public.blogSubmit} className={buttonClass({ variant: 'primary', size: 'sm' })}>
            Beitrag einreichen
          </Link>
        </div>
      </div>
    </nav>
  )
}
