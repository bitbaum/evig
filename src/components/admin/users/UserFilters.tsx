'use client'

/**
 * User Filters Component
 *
 * Search and filter controls for the users list.
 */

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface UserFiltersProps {
  search: string
  type: string
  verified: string
  onSearchChange: (value: string) => void
  onTypeChange: (value: string) => void
  onVerifiedChange: (value: string) => void
}

export function UserFilters({
  search,
  type,
  verified,
  onSearchChange,
  onTypeChange,
  onVerifiedChange,
}: UserFiltersProps) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Benutzer suchen..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-40">
          <Select value={type} onChange={(e) => onTypeChange(e.target.value)}>
            <option value="all">Alle Typen</option>
            <option value="staff">Staff</option>
            <option value="regular">Benutzer</option>
          </Select>
        </div>

        {/* Verified Filter */}
        <div className="w-full sm:w-40">
          <Select value={verified} onChange={(e) => onVerifiedChange(e.target.value)}>
            <option value="all">Alle Status</option>
            <option value="yes">Verifiziert</option>
            <option value="no">Nicht verifiziert</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
