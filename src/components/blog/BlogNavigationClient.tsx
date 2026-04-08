'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/lib/blog-db'
import { UI_COLOR_PALETTE } from '@/config/ui-colors'
import Heading from '@/components/ui/Heading'

interface BlogNavigationClientProps {
  categories: BlogCategory[]
  selectedCategorySlugs: string[]
}

// Default colors for categories without a custom color
const DEFAULT_COLORS = UI_COLOR_PALETTE

function getCategoryColor(category: BlogCategory, index: number): string {
  if (category.color) return category.color
  return DEFAULT_COLORS[index % DEFAULT_COLORS.length]
}

export default function BlogNavigationClient({
  categories,
  selectedCategorySlugs,
}: BlogNavigationClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleCategoryChange = (categorySlug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const currentSlugs = params.get('categories')?.split(',').filter(Boolean) || []

    let newSlugs: string[]
    if (currentSlugs.includes(categorySlug)) {
      newSlugs = currentSlugs.filter((s) => s !== categorySlug)
    } else {
      newSlugs = [...currentSlugs, categorySlug]
    }

    if (newSlugs.length > 0) {
      params.set('categories', newSlugs.join(','))
    } else {
      params.delete('categories')
    }
    router.push(`/blog?${params.toString()}`)
    setMobileMenuOpen(false)
  }

  const handleClearFilters = () => {
    router.push('/blog')
    setMobileMenuOpen(false)
  }

  const isSelected = (slug: string) => selectedCategorySlugs.includes(slug)

  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Title */}
          <Link href="/blog" className="flex items-center">
            <Heading level={1} className="text-xl sm:text-2xl font-bold text-gray-900">Blog</Heading>
          </Link>

          {/* Desktop Categories */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                selectedCategorySlugs.length === 0
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Alle
            </button>
            {categories.map((category, index) => {
              const color = getCategoryColor(category, index)
              const selected = isSelected(category.slug)

              return (
                <div key={category.slug} className="relative group">
                  <button
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      selected
                        ? "text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                    style={selected ? { backgroundColor: color } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full mr-1.5",
                        selected ? "bg-white/80" : ""
                      )}
                      style={!selected ? { backgroundColor: color } : undefined}
                    />
                    {category.name}
                  </button>

                  {/* Tooltip with description */}
                  {category.description && (
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 transition-all max-w-xs text-center">
                      {category.description}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent border-b-gray-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Menu Button + CTA */}
          <div className="flex items-center gap-2">
            {/* Mobile dropdown trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
            >
              {selectedCategorySlugs.length > 0 ? (
                <>
                  {selectedCategorySlugs.length} Filter
                  <X
                    className="w-4 h-4 ml-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClearFilters()
                    }}
                  />
                </>
              ) : (
                <>
                  Kategorien
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileMenuOpen && "rotate-180")} />
                </>
              )}
            </button>

            {/* CTA */}
            <Link
              href="/blog/submit"
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-semibold"
            >
              Beitrag einreichen
            </Link>
          </div>
        </div>

        {/* Mobile Categories Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleClearFilters}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectedCategorySlugs.length === 0
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700"
                )}
              >
                Alle
              </button>
              {categories.map((category, index) => {
                const color = getCategoryColor(category, index)
                const selected = isSelected(category.slug)

                return (
                  <button
                    key={category.slug}
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      selected
                        ? "text-white"
                        : "bg-gray-100 text-gray-700"
                    )}
                    style={selected ? { backgroundColor: color } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full mr-1.5",
                        selected ? "bg-white/80" : ""
                      )}
                      style={!selected ? { backgroundColor: color } : undefined}
                    />
                    {category.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
