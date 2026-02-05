'use client'

/**
 * User Filters Component
 *
 * Search and filter controls for the users list.
 */

import { Search } from 'lucide-react'

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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Benutzer suchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Type Filter */}
        <div className="w-full sm:w-40">
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle Typen</option>
            <option value="staff">Staff</option>
            <option value="regular">Benutzer</option>
          </select>
        </div>

        {/* Verified Filter */}
        <div className="w-full sm:w-40">
          <select
            value={verified}
            onChange={(e) => onVerifiedChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle Status</option>
            <option value="yes">Verifiziert</option>
            <option value="no">Nicht verifiziert</option>
          </select>
        </div>
      </div>
    </div>
  )
}
