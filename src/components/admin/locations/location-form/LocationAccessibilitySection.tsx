'use client'

import { CheckCircle } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { LocationFormData } from './types'

interface Props {
  formData: LocationFormData
  onAccessibilityChange: (field: string, value: string | boolean) => void
}

export function LocationAccessibilitySection({ formData, onAccessibilityChange }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-neutral-900 mb-4 flex items-center">
        <CheckCircle className="w-5 h-5 mr-2" />
        Barrierefreiheit & Zugänglichkeit
      </Heading>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="wheelchair"
            checked={formData.accessibility_info.wheelchairAccessible}
            onChange={() => onAccessibilityChange('wheelchairAccessible', !formData.accessibility_info.wheelchairAccessible)}
            className="mr-3 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="wheelchair" className="text-sm font-medium text-neutral-700">
            Rollstuhlgerecht
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="parking"
            checked={formData.accessibility_info.parkingAvailable}
            onChange={() => onAccessibilityChange('parkingAvailable', !formData.accessibility_info.parkingAvailable)}
            className="mr-3 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="parking" className="text-sm font-medium text-neutral-700">
            Parkplatz verfügbar
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Öffentlicher Verkehr
          </label>
          <input
            type="text"
            value={formData.accessibility_info.publicTransport}
            onChange={(e) => onAccessibilityChange('publicTransport', e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. 5 Min. zu Fuss zur Tramhaltestelle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Zusätzliche Informationen
          </label>
          <textarea
            value={formData.accessibility_info.additionalInfo}
            onChange={(e) => onAccessibilityChange('additionalInfo', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="z.B. Rampe vorhanden, Aufzug verfügbar, etc."
          />
        </div>
      </div>
    </div>
  )
}
