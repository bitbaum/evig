'use client'

import { APPROVAL_STATUS_BADGES } from '@/config/approval-status'
import type { FilterStatus, StatusCounts } from './types'

const FILTER_OPTIONS = ['all', 'pending', 'approved', 'rejected', 'published'] as const

interface SubmissionFiltersProps {
  filter: FilterStatus
  counts: StatusCounts
  onFilterChange: (status: FilterStatus) => void
}

export function SubmissionFilters({ filter, counts, onFilterChange }: SubmissionFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status === 'all'
              ? 'Alle'
              : APPROVAL_STATUS_BADGES[status]?.label || status}{' '}
            ({counts[status]})
          </button>
        ))}
      </div>
    </div>
  )
}
