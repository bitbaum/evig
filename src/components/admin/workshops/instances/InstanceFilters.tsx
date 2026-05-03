'use client'

import type { Workshop, InstanceFiltersState } from './types'
import { WORKSHOP_INSTANCE_STATUS, WORKSHOP_INSTANCE_STATUS_LABELS } from '@/config/workshops'

interface InstanceFiltersProps {
  filters: InstanceFiltersState
  setFilters: React.Dispatch<React.SetStateAction<InstanceFiltersState>>
  workshops: Workshop[]
}

export function InstanceFilters({ filters, setFilters, workshops }: InstanceFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Workshop</label>
          <select
            value={filters.workshopId}
            onChange={(e) => setFilters(prev => ({ ...prev, workshopId: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Alle Workshops</option>
            {workshops.map(w => (
              <option key={w.id} value={w.id}>{w.title}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle</option>
            <option value={WORKSHOP_INSTANCE_STATUS.SCHEDULED}>{WORKSHOP_INSTANCE_STATUS_LABELS[WORKSHOP_INSTANCE_STATUS.SCHEDULED]}</option>
            <option value={WORKSHOP_INSTANCE_STATUS.CANCELLED}>{WORKSHOP_INSTANCE_STATUS_LABELS[WORKSHOP_INSTANCE_STATUS.CANCELLED]}</option>
            <option value={WORKSHOP_INSTANCE_STATUS.COMPLETED}>{WORKSHOP_INSTANCE_STATUS_LABELS[WORKSHOP_INSTANCE_STATUS.COMPLETED]}</option>
          </select>
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center px-4 py-2 border rounded-lg cursor-pointer hover:bg-neutral-50">
            <input
              type="checkbox"
              checked={filters.upcoming}
              onChange={(e) => setFilters(prev => ({ ...prev, upcoming: e.target.checked }))}
              className="mr-2"
            />
            Nur zukünftige
          </label>
        </div>
      </div>
    </div>
  )
}
