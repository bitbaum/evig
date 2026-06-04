import { Filter } from 'lucide-react'
import {
  getDonationTypeOptions,
  getDonationStatusOptions,
  type DonationType,
  type DonationStatus,
} from '@/config/donations'
import { Select } from '@/components/ui/select'
import type { DonationFiltersState } from './types'

interface Props {
  filters: DonationFiltersState
  onFiltersChange: (filters: DonationFiltersState) => void
}

export function DonationFilters({ filters, onFiltersChange }: Props) {
  return (
    <div className="bg-surface-base rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-text-tertiary" />
          <span className="text-sm font-medium text-text-secondary">Filter:</span>
        </div>
        <Select
          value={filters.donation_type}
          onChange={(e) => onFiltersChange({ ...filters, donation_type: e.target.value as DonationType | 'all' })}
        >
          <option value="all">Alle Typen</option>
          {getDonationTypeOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as DonationStatus | 'all' })}
        >
          <option value="all">Alle Status</option>
          {getDonationStatusOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
    </div>
  )
}
