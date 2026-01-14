import React from 'react'
import { Filter } from 'lucide-react'
import { FilterConfig, FilterState } from '@/hooks/useFiltering'

interface FilterBarProps {
  filters: FilterConfig[]
  filterState: FilterState
  onFilterChange: (filterKey: string, value: string) => void
  onFilterToggle?: (filterKey: string, value: string) => void
  enableToggle?: boolean
  className?: string
}

const colorVariants = {
  green: {
    active: 'bg-green-600 text-white shadow-lg transform scale-105',
    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
  },
  blue: {
    active: 'bg-blue-600 text-white shadow-lg transform scale-105',
    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
  },
  purple: {
    active: 'bg-purple-600 text-white shadow-lg transform scale-105',
    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
  },
  orange: {
    active: 'bg-orange-600 text-white shadow-lg transform scale-105',
    inactive: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
  }
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
    <div className={`max-w-3xl mx-auto text-center ${className}`}>
      {filters.map((filter, index) => (
        <div key={filter.key} className={`flex flex-wrap justify-center gap-3 ${index === 0 ? 'mb-8' : 'mb-12'}`}>
          <div className="flex items-center text-gray-500 mr-4 mb-2">
            <Filter className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">{filter.label}:</span>
          </div>
          {filter.options.map((option) => {
            const isActive = filterState[filter.key] === option
            const colorScheme = colorVariants[filter.color || 'green']
            
            const handleClick = () => {
              if (enableToggle && onFilterToggle && option !== 'Alle') {
                onFilterToggle(filter.key, option)
              } else {
                onFilterChange(filter.key, option)
              }
            }

            return (
              <button
                key={option}
                onClick={handleClick}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive ? colorScheme.active : colorScheme.inactive
                }`}
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