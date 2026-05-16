'use client'

import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type OSSAlternative,
  type OSSCategory,
  searchAlternatives,
} from '@/config/open-source-registry'
import { AlternativeCard } from './AlternativeCard'
import { EmptyState } from '@/components/common/EmptyState'
import { useTranslations } from 'next-intl'

interface RegistrySearchProps {
  alternatives: OSSAlternative[]
  categories: OSSCategory[]
}

export function RegistrySearch({ alternatives, categories }: RegistrySearchProps) {
  const [query, setQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const t = useTranslations('services.openSourceSolutions.search')

  const filtered = useMemo(() => {
    let results = query ? searchAlternatives(query) : alternatives
    if (activeCategoryId) {
      results = results.filter(a => a.categoryId === activeCategoryId)
    }
    return results
  }, [query, activeCategoryId, alternatives])

  const activeCategory = categories.find(c => c.id === activeCategoryId)

  const resultCountLabel = (() => {
    if (query && activeCategory) return t('resultCountForIn', { count: filtered.length, query, category: activeCategory.label })
    if (query) return t('resultCountFor', { count: filtered.length, query })
    if (activeCategory) return t('resultCountIn', { count: filtered.length, category: activeCategory.label })
    return t('resultCount', { count: filtered.length })
  })()

  return (
    <div>
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('placeholder')}
            aria-label={t('ariaLabel')}
            className={cn(
              'w-full pl-12 pr-10 py-3 sm:py-4 rounded-xl border-2 border-neutral-200',
              'bg-white text-neutral-900 placeholder-neutral-400',
              'focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100',
              'text-sm sm:text-base transition-colors'
            )}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              aria-label={t('clearAriaLabel')}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={cn(
            'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            !activeCategoryId
              ? 'bg-primary-600 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          )}
        >
          {t('allCategories')}
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(activeCategoryId === cat.id ? null : cat.id)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              activeCategoryId === cat.id
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            )}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-neutral-500 mb-6">{resultCountLabel}</p>

      {/* Results grid or empty state */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filtered.map(alt => (
            <AlternativeCard key={alt.id} alternative={alt} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Search}
          title={t('noResultsTitle')}
          message={t('noResultsMessage', { query })}
          action={{
            label: t('clearSearch'),
            onClick: () => { setQuery(''); setActiveCategoryId(null) },
          }}
        />
      )}
    </div>
  )
}
