import React from 'react'
import { FilterBar } from './FilterBar'
import { FilterableGrid } from './FilterableGrid'
import { useFiltering, FilterConfig, FilterableItem } from '@/hooks/useFiltering'
import Heading from '@/components/ui/Heading'

interface FilterableSectionProps<T extends FilterableItem> {
  title: string
  description?: string
  items: T[]
  filters: FilterConfig[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  noResultsMessage?: string
  showResultsCount?: boolean
  allLabel?: string
  className?: string
  gridColumns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function FilterableSection<T extends FilterableItem>({
  title,
  description,
  items,
  filters,
  renderItem,
  keyExtractor,
  noResultsMessage = 'Keine Ergebnisse gefunden, die den ausgewählten Filtern entsprechen.',
  showResultsCount = true,
  allLabel = 'Alle',
  className = '',
  gridColumns = { sm: 1, md: 2, lg: 3 }
}: FilterableSectionProps<T>) {
  const {
    filterState,
    filteredItems,
    filterOptions,
    updateFilter,
    toggleFilter,
    resetFilters,
    getFilterSummary,
    hasActiveFilters
  } = useFiltering({
    items,
    filters,
    allLabel
  })

  return (
    <section className={`py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <Heading level={2} className="text-3xl font-bold mb-6">{title}</Heading>
          {description && (
            <p className="text-lg text-gray-600 mb-8">{description}</p>
          )}
          
          <FilterBar
            filters={filterOptions}
            filterState={filterState}
            onFilterChange={updateFilter}
            onFilterToggle={toggleFilter}
            enableToggle={true}
          />
        </div>

        {/* Results */}
        {filteredItems.length > 0 ? (
          <FilterableGrid
            items={filteredItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            columns={gridColumns}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-lg text-gray-600 mb-4">{noResultsMessage}</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Filter zurücksetzen
              </button>
            )}
          </div>
        )}

        {/* Results count */}
        {showResultsCount && (
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {filteredItems.length} von {items.length} Ergebnissen
              {getFilterSummary() && ` (${getFilterSummary()})`}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}