'use client'

import { MapPin } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import type { LocationFormData, SubmitResult } from './types'
import { LOCATION_TYPES } from './types'

interface Props {
  formData: LocationFormData
  submitResult: SubmitResult | null
  onFieldChange: <K extends keyof LocationFormData>(field: K, value: LocationFormData[K]) => void
}

export function LocationBasicInfoSection({ formData, submitResult, onFieldChange }: Props) {
  const hasError = submitResult !== null && !submitResult.success

  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-gray-900 mb-4 flex items-center">
        <MapPin className="w-5 h-5 mr-2" />
        Grundinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name des Ortes *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Gemeinschaftszentrum Zürich-West"
            required
            aria-required="true"
            aria-invalid={hasError}
            aria-describedby={hasError ? 'location-form-error' : undefined}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ortstyp *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LOCATION_TYPES.map((type) => (
              <label key={type.id} className="relative">
                <input
                  type="radio"
                  value={type.id}
                  checked={formData.type === type.id}
                  onChange={(e) => onFieldChange('type', e.target.value as LocationFormData['type'])}
                  className="sr-only peer"
                />
                <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.type === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <type.icon className={`w-6 h-6 mb-2 ${
                    formData.type === type.id ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Beschreibung
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Beschreiben Sie den Ort, seine Ausstattung und besondere Merkmale..."
          />
        </div>
      </div>
    </div>
  )
}
