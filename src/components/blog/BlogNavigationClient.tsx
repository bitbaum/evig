'use client'

import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/lib/blog-db'
import { UI_COLOR_PALETTE } from '@/config/ui-colors'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

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
  const t = useTranslations('blog')
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
    <nav className="border-b border bg-surface-base sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo/Title */}
          <Link href={ROUTES.public.blog} className="flex items-center">
            <Heading level={1} className="text-xl sm:text-2xl font-bold text-text-primary">Blog</Heading>
          </Link>

          {/* Desktop Categories */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                selectedCategorySlugs.length === 0
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-surface-raised text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700"
              )}
            >
              {t('all')}
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
                        : "bg-surface-raised text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-neutral-900 text-white text-xs rounded-lg whitespace-nowrap z-10 transition-all max-w-xs text-center">
                      {category.description}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent border-b-neutral-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile Menu Button + CTA */}
          <div className="flex items-center gap-2">
            {/* Mobile dropdown trigger */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="secondary"
              size="sm"
              className="md:hidden gap-1"
            >
              {selectedCategorySlugs.length > 0 ? (
                <>
                  {t('filterCount', { count: selectedCategorySlugs.length })}
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
                  {t('categories')}
                  <ChevronDown className={cn("w-4 h-4 transition-transform", mobileMenuOpen && "rotate-180")} />
                </>
              )}
            </Button>

            {/* CTA */}
            <Button as={Link} href={ROUTES.public.blogSubmit} variant="primary" size="sm">
              {t('navSubmitPost')}
            </Button>
          </div>
        </div>

        {/* Mobile Categories Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-subtle">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleClearFilters}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                  selectedCategorySlugs.length === 0
                    ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                    : "bg-surface-raised text-text-secondary"
                )}
              >
                {t('all')}
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
                        : "bg-surface-raised text-text-secondary"
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
