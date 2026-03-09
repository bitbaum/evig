import { Filter } from 'lucide-react'
import {
  getDonationTypeOptions,
  getDonationStatusOptions,
  type DonationType,
  type DonationStatus,
} from '@/config/donations'
import type { DonationFiltersState } from './types'

interface Props {
  filters: DonationFiltersState
  onFiltersChange: (filters: DonationFiltersState) => void
}

export function DonationFilters({ filters, onFiltersChange }: Props) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <select
          value={filters.donation_type}
          onChange={(e) => onFiltersChange({ ...filters, donation_type: e.target.value as DonationType | 'all' })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Alle Typen</option>
          {getDonationTypeOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as DonationStatus | 'all' })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="all">Alle Status</option>
          {getDonationStatusOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
