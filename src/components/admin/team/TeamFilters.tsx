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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
    <div className="bg-surface-base rounded-xl shadow-sm border border-subtle dark:border-white/[0.06] p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
            <Input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name oder Position suchen..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div className="w-full lg:w-48">
          <Select
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">Alle Abteilungen</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept as Department] || dept}
              </option>
            ))}
          </Select>
        </div>

        {/* Employment Type Filter */}
        <div className="w-full lg:w-48">
          <Select
            value={employmentType}
            onChange={(e) => onEmploymentTypeChange(e.target.value)}
          >
            <option value="">Alle Typen</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {EMPLOYMENT_TYPE_LABELS[type as EmploymentType] || type}
              </option>
            ))}
          </Select>
        </div>

        {/* Active Status Filter */}
        <div className="w-full lg:w-40">
          <Select
            value={isActive}
            onChange={(e) => onIsActiveChange(e.target.value)}
          >
            <option value="all">Alle Status</option>
            <option value="true">Aktiv</option>
            <option value="false">Inaktiv</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
