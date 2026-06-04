'use client'

import { APPROVAL_STATUS, APPROVAL_STATUS_BADGES } from '@/config/approval-status'
import type { FilterStatus, StatusCounts } from './types'

const FILTER_OPTIONS = ['all', APPROVAL_STATUS.PENDING, APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.REJECTED, APPROVAL_STATUS.PUBLISHED] as const

interface SubmissionFiltersProps {
  filter: FilterStatus
  counts: StatusCounts
  onFilterChange: (status: FilterStatus) => void
}

export function SubmissionFilters({ filter, counts, onFilterChange }: SubmissionFiltersProps) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((status) => (
          <button
            key={status}
            onClick={() => onFilterChange(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-surface-raised dark:bg-neutral-700 text-text-secondary hover:bg-neutral-200 dark:hover:bg-neutral-600'
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
