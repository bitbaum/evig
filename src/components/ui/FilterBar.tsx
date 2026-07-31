import React from 'react'
import { Filter } from 'lucide-react'
import { navLinkClass } from '@/lib/design/nav'
import { cn } from '@/lib/utils'
import { FilterConfig, FilterState } from '@/hooks/useFiltering'

interface FilterBarProps {
  filters: FilterConfig[]
  filterState: FilterState
  onFilterChange: (filterKey: string, value: string) => void
  onFilterToggle?: (filterKey: string, value: string) => void
  enableToggle?: boolean
  className?: string
}

const FilterBarComponent: React.FC<FilterBarProps> = ({
  filters,
  filterState,
  onFilterChange,
  onFilterToggle,
  enableToggle = true,
  className = ''
}) => {
  return (
    <div className={cn('max-w-3xl mx-auto text-center', className)}>
      {filters.map((filter, index) => (
        <div key={filter.key} className={cn('flex flex-wrap justify-center gap-3', index === 0 ? 'mb-8' : 'mb-12')}>
          <div className="flex items-center text-text-secondary mr-4 mb-2">
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{filter.label}:</span>
          </div>
          {filter.options.map((option) => {
            const isActive = filterState[filter.key] === option

            const handleClick = () => {
              if (enableToggle && onFilterToggle && option !== (filter.allValue ?? '')) {
                onFilterToggle(filter.key, option)
              } else {
                onFilterChange(filter.key, option)
              }
            }

            return (
              <button
                key={option}
                type="button"
                onClick={handleClick}
                aria-pressed={isActive}
                className={navLinkClass('chip', isActive)}
              >
                {option}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders when parent updates
export const FilterBar = React.memo(FilterBarComponent)
