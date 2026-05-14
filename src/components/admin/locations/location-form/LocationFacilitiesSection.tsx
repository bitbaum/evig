'use client'

import { Users } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/ui/form-field'
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
      <Heading level={2} className="text-xl text-neutral-900 mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2" />
        Kapazität & Ausstattung
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Maximale Kapazität (Personen)">
          <Input
            type="number"
            min="1"
            value={formData.max_capacity}
            onChange={(e) => onFieldChange('max_capacity', e.target.value)}
            placeholder="50"
          />
        </FormField>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-3">
            Verfügbare Einrichtungen
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FACILITIES.map(facility => (
              <label key={facility} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.facilities.includes(facility)}
                  onChange={(e) => onFacilityChange(facility, e.target.checked)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-neutral-700 capitalize">
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
