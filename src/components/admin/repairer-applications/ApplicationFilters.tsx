import { Filter, Search } from 'lucide-react'
import { getApprovalStatusLabel, type ApprovalStatus } from '@/config/approval-status'
import type { ApplicationStatus } from './types'

interface Props {
  selectedStatus: ApplicationStatus
  searchQuery: string
  onStatusChange: (status: ApplicationStatus) => void
  onSearchChange: (query: string) => void
}

const STATUS_OPTIONS: ApplicationStatus[] = ['pending', 'approved', 'rejected', 'requires_changes']

export function ApplicationFilters({ selectedStatus, searchQuery, onStatusChange, onSearchChange }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Status:</span>
          </div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => onStatusChange(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getApprovalStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Suchen nach Name, E-Mail oder Beschreibung..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
