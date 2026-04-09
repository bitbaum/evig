'use client'

import { Search, X } from 'lucide-react'

export interface FilterDropdown {
  key: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string
}

export interface AdminFilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  dropdowns?: FilterDropdown[]
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  children?: React.ReactNode
}

export function AdminFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Suchen...',
  dropdowns = [],
  hasActiveFilters = false,
  onClearFilters,
  children,
}: AdminFilterBarProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-wrap gap-4">
        {onSearchChange !== undefined && (
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">Suche</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchValue ?? ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {dropdowns.map((dropdown) => (
          <div key={dropdown.key} className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">{dropdown.label}</label>
            <select
              value={dropdown.value}
              onChange={(e) => dropdown.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{dropdown.allLabel ?? 'Alle'}</option>
              {dropdown.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {children}

        {hasActiveFilters && onClearFilters && (
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Filter zurücksetzen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
