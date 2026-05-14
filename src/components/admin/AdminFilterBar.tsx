'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'

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
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      {/* Stack vertically on mobile, row on sm+ — each field is max 240px on desktop to prevent
          dropdowns stretching absurdly wide in wide containers */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {onSearchChange !== undefined && (
          <div className="w-full sm:flex-[0_1_240px]">
            <FormField label="Suche" htmlFor="admin-filter-search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="admin-filter-search"
                  type="text"
                  value={searchValue ?? ''}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        )}

        {dropdowns.map((dropdown) => {
          const selectId = `admin-filter-${dropdown.key}`
          return (
            <div key={dropdown.key} className="w-full sm:flex-[0_1_200px]">
              <FormField label={dropdown.label} htmlFor={selectId}>
                <Select
                  id={selectId}
                  value={dropdown.value}
                  onChange={(e) => dropdown.onChange(e.target.value)}
                >
                  <option value="all">{dropdown.allLabel ?? 'Alle'}</option>
                  {dropdown.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            </div>
          )
        })}

        {children}

        {hasActiveFilters && onClearFilters && (
          <div className="flex items-end">
            <Button
              onClick={onClearFilters}
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <X className="w-4 h-4" />
              Filter zurücksetzen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
