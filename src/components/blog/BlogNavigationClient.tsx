'use client'

import { Link } from '@/i18n/navigation'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown, X, Search, Rss } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BlogCategory } from '@/lib/blog-db'
import { UI_COLOR_PALETTE } from '@/config/ui-colors'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslations } from 'next-intl'
import { ROUTES } from '@/config/routes'

interface BlogNavigationClientProps {
  categories: BlogCategory[]
  selectedCategorySlugs: string[]
  searchQuery?: string
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
  searchQuery = '',
}: BlogNavigationClientProps) {
  const t = useTranslations('blog')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchQuery)

  // Any filter change resets pagination — page N of the old result set is
  // meaningless for the new one.
  const pushParams = (params: URLSearchParams) => {
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `/blog?${qs}` : '/blog')
    setMobileMenuOpen(false)
  }

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
    pushParams(params)
  }

  const handleClearFilters = () => {
    setSearchInput('')
    router.push('/blog')
    setMobileMenuOpen(false)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const q = searchInput.trim()
    if (q) {
      params.set('q', q)
    } else {
      params.delete('q')
    }
    pushParams(params)
  }

  const isSelected = (slug: string) => selectedCategorySlugs.includes(slug)

  const searchField = (
    <form onSubmit={handleSearchSubmit} role="search" className="relative min-w-0 flex-1 md:w-44 md:flex-none lg:w-56">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" aria-hidden="true" />
      <Input
        type="search"
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
        placeholder={t('search.placeholder')}
        aria-label={t('search.placeholder')}
        className="h-10 w-full pl-9 pr-3 text-sm"
      />
    </form>
  )

  return (
    <nav className="border-b border bg-surface-base sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-14 sm:h-16">
          {/* Logo/Title */}
          <Link href={ROUTES.public.blog} className="flex shrink-0 items-center">
            <Heading level={1} className="text-xl sm:text-2xl font-bold text-text-primary">Blog</Heading>
          </Link>

          {/* Desktop Categories — scrolls horizontally instead of overflowing the bar */}
          <div className="hidden md:flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className={cn(
                "shrink-0 px-3 py-1.5 rounded-full text-sm font-medium h-auto",
                selectedCategorySlugs.length === 0
                  ? "bg-surface-overlay text-text-inverted"
                  : "bg-surface-raised text-text-secondary hover:bg-surface-overlay"
              )}
            >
              {t('all')}
            </Button>
            {categories.map((category, index) => {
              const color = getCategoryColor(category, index)
              const selected = isSelected(category.slug)

              return (
                <div key={category.slug} className="relative group shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-sm font-medium h-auto",
                      selected
                        ? "text-text-inverted"
                        : "bg-surface-raised text-text-secondary hover:bg-surface-overlay"
                    )}
                    style={selected ? { backgroundColor: color } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full mr-1.5",
                        selected ? "bg-surface-base/80" : ""
                      )}
                      style={!selected ? { backgroundColor: color } : undefined}
                    />
                    {category.name}
                  </Button>

                  {/* Tooltip with description */}
                  {category.description && (
                    <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 absolute left-1/2 -translate-x-1/2 top-full mt-2 px-3 py-2 bg-surface-overlay text-text-inverted text-xs rounded-lg whitespace-nowrap z-10 transition-all max-w-xs text-center">
                      {category.description}
                      <span className="absolute left-1/2 -translate-x-1/2 bottom-full border-4 border-transparent border-b-surface-overlay" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Search (desktop) + RSS + Mobile Menu Button + CTA */}
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden md:block">{searchField}</div>

            {/* RSS — the feed exists; make it findable. On the smallest screens
                it moves into the dropdown so the bar never overflows. */}
            <a
              href="/feed.xml"
              className="hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-raised hover:text-text-primary"
              title={t('rss')}
              aria-label={t('rss')}
            >
              <Rss className="h-4 w-4" />
            </a>

            {/* Mobile dropdown trigger */}
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="secondary"
              size="sm"
              className="md:hidden min-h-10 gap-1"
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
            <Button as={Link} href={ROUTES.public.blogSubmit} variant="primary" size="sm" className="min-h-10">
              {t('navSubmitPost')}
            </Button>
          </div>
        </div>

        {/* Mobile Categories Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-subtle space-y-3">
            {searchField}
            <a
              href="/feed.xml"
              className="sm:hidden inline-flex min-h-11 items-center gap-2 text-sm text-text-secondary"
            >
              <Rss className="h-4 w-4" aria-hidden="true" />
              {t('rss')}
            </a>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className={cn(
                  // min-h-11 = 44px WCAG touch target on touch-first screens
                  "px-4 min-h-11 rounded-full text-sm font-medium h-auto",
                  selectedCategorySlugs.length === 0
                    ? "bg-surface-overlay text-text-inverted"
                    : "bg-surface-raised text-text-secondary"
                )}
              >
                {t('all')}
              </Button>
              {categories.map((category, index) => {
                const color = getCategoryColor(category, index)
                const selected = isSelected(category.slug)

                return (
                  <Button
                    key={category.slug}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCategoryChange(category.slug)}
                    className={cn(
                      "px-4 min-h-11 rounded-full text-sm font-medium h-auto",
                      selected
                        ? "text-text-inverted"
                        : "bg-surface-raised text-text-secondary"
                    )}
                    style={selected ? { backgroundColor: color } : undefined}
                  >
                    <span
                      className={cn(
                        "inline-block w-2 h-2 rounded-full mr-1.5",
                        selected ? "bg-surface-base/80" : ""
                      )}
                      style={!selected ? { backgroundColor: color } : undefined}
                    />
                    {category.name}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
