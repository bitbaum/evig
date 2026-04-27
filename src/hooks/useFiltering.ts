import { useState, useMemo } from 'react'

export interface FilterConfig {
  key: string
  label: string
  options: string[]
  defaultValue?: string
  color?: 'green' | 'blue' | 'purple' | 'orange'
  /** The sentinel value that means "show all" — set automatically by useFiltering */
  allValue?: string
}

// Any object type can be filtered — we cast to Record internally when reading by key
export type FilterableItem = object

export interface UseFilteringProps<T extends FilterableItem> {
  items: T[]
  filters: FilterConfig[]
  allLabel?: string
}

export interface FilterState {
  [key: string]: string
}

export function useFiltering<T extends FilterableItem>({
  items,
  filters,
  allLabel = 'Alle'
}: UseFilteringProps<T>) {
  const initialState: FilterState = filters.reduce((acc, filter) => {
    acc[filter.key] = filter.defaultValue || allLabel
    return acc
  }, {} as FilterState)

  const [filterState, setFilterState] = useState<FilterState>(initialState)

  const filterOptions = useMemo(() => {
    return filters.map(filter => {
      const uniqueValues = Array.from(new Set(
        items.map(item => (item as Record<string, unknown>)[filter.key])
      ))
      return {
        ...filter,
        allValue: allLabel,
        options: [allLabel, ...filter.options.filter(opt =>
          opt === allLabel || uniqueValues.includes(opt)
        )]
      }
    })
  }, [items, filters, allLabel])

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const row = item as Record<string, unknown>
      return filters.every(filter => {
        const selectedValue = filterState[filter.key]
        return selectedValue === allLabel || row[filter.key] === selectedValue
      })
    })
  }, [items, filters, filterState, allLabel])

  // Update a specific filter
  const updateFilter = (filterKey: string, value: string) => {
    setFilterState(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  // Toggle a filter (if already selected, revert to "All")
  const toggleFilter = (filterKey: string, value: string) => {
    setFilterState(prev => {
      const currentValue = prev[filterKey]
      const newValue = currentValue === value ? allLabel : value
      return {
        ...prev,
        [filterKey]: newValue
      }
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterState(initialState)
  }

  // Get current filter summary for display
  const getFilterSummary = () => {
    const activeFilters = filters
      .filter(filter => filterState[filter.key] !== allLabel)
      .map(filter => `${filter.label}: "${filterState[filter.key]}"`)
    
    return activeFilters.length > 0 ? activeFilters.join(', ') : null
  }

  return {
    filterState,
    filteredItems,
    filterOptions,
    updateFilter,
    toggleFilter,
    resetFilters,
    getFilterSummary,
    hasActiveFilters: Object.values(filterState).some(value => value !== allLabel)
  }
}