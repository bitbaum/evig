import { Filter, Search } from 'lucide-react'
import { APPROVAL_STATUS, getApprovalStatusLabel } from '@/config/approval-status'
import { Input } from '@/components/ui/input'
import type { ApplicationStatus } from './types'

interface Props {
  selectedStatus: ApplicationStatus
  searchQuery: string
  onStatusChange: (status: ApplicationStatus) => void
  onSearchChange: (query: string) => void
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  APPROVAL_STATUS.PENDING,
  APPROVAL_STATUS.APPROVED,
  APPROVAL_STATUS.REJECTED,
  APPROVAL_STATUS.REQUIRES_CHANGES,
]

export function ApplicationFilters({ selectedStatus, searchQuery, onStatusChange, onSearchChange }: Props) {
  return (
    <div className="bg-surface-base rounded-lg shadow-xs border border p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-text-muted" />
            <span className="text-sm font-medium text-text-secondary">Status:</span>
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                    : 'bg-surface-raised text-text-secondary hover:bg-neutral-200'
                }`}
              >
                {getApprovalStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Suchen nach Name, E-Mail oder Beschreibung..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  )
}
