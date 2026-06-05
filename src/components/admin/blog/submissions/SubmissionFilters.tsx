'use client'

import { Button } from '@/components/ui/button'
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
          <Button
            key={status}
            variant={filter === status ? 'primary' : 'ghost'}
            onClick={() => onFilterChange(status)}
            className={
              filter === status
                ? ''
                : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
            }
          >
            {status === 'all'
              ? 'Alle'
              : APPROVAL_STATUS_BADGES[status]?.label || status}{' '}
            ({counts[status]})
          </Button>
        ))}
      </div>
    </div>
  )
}
