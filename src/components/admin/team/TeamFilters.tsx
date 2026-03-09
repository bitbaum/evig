'use client'

/**
 * Team Filters Component
 *
 * Filter controls for the team list.
 * Uses config from @/config/team for options (SSOT).
 */

import { Search } from 'lucide-react'
import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  type Department,
  type EmploymentType,
} from '@/config/team'
import type { TeamFiltersProps } from './types'

export function TeamFilters({
  department,
  employmentType,
  isActive,
  search,
  onDepartmentChange,
  onEmploymentTypeChange,
  onIsActiveChange,
  onSearchChange,
}: TeamFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name oder Position suchen..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="w-full lg:w-48">
          <select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Alle Abteilungen</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept as Department] || dept}
              </option>
            ))}
          </select>
        </div>

        {/* Employment Type Filter */}
        <div className="w-full lg:w-48">
          <select
            value={employmentType}
            onChange={(e) => onEmploymentTypeChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Alle Typen</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {EMPLOYMENT_TYPE_LABELS[type as EmploymentType] || type}
              </option>
            ))}
          </select>
        </div>

        {/* Active Status Filter */}
        <div className="w-full lg:w-40">
          <select
            value={isActive}
            onChange={(e) => onIsActiveChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Alle Status</option>
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </select>
        </div>
      </div>
    </div>
  )
}
