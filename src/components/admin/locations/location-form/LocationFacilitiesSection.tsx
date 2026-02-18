'use client'

import { Users } from 'lucide-react'
import type { LocationFormData } from './types'
import { FACILITIES } from './types'

interface Props {
  formData: LocationFormData
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
  onFacilityChange: (facility: string, checked: boolean) => void
}

export function LocationFacilitiesSection({ formData, onFieldChange, onFacilityChange }: Props) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Kapazität & Ausstattung
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximale Kapazität (Personen)
          </label>
          <input
            type="number"
            min="1"
            value={formData.max_capacity}
            onChange={(e) => onFieldChange('max_capacity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="50"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Verfügbare Einrichtungen
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FACILITIES.map(facility => (
              <label key={facility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.facilities.includes(facility)}
                  onChange={(e) => onFacilityChange(facility, e.target.checked)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {facility.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
