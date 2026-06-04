'use client'

import { CheckCircle } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import type { LocationFormData } from './types'

interface Props {
  formData: LocationFormData
  onAccessibilityChange: (field: string, value: string | boolean) => void
}

export function LocationAccessibilitySection({ formData, onAccessibilityChange }: Props) {
  return (
    <div className="mb-8">
      <Heading level={2} className="text-xl text-text-primary mb-4 flex items-center">
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
            className="mr-3 text-action focus:ring-primary-500"
          />
          <label htmlFor="wheelchair" className="text-sm font-medium text-text-secondary">
            Rollstuhlgerecht
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="parking"
            checked={formData.accessibility_info.parkingAvailable}
            onChange={() => onAccessibilityChange('parkingAvailable', !formData.accessibility_info.parkingAvailable)}
            className="mr-3 text-action focus:ring-primary-500"
          />
          <label htmlFor="parking" className="text-sm font-medium text-text-secondary">
            Parkplatz verfügbar
          </label>
        </div>

        <FormField label="Öffentlicher Verkehr">
          <Input
            type="text"
            value={formData.accessibility_info.publicTransport}
            onChange={(e) => onAccessibilityChange('publicTransport', e.target.value)}
            placeholder="z.B. 5 Min. zu Fuss zur Tramhaltestelle"
          />
        </FormField>

        <FormField label="Zusätzliche Informationen">
          <Textarea
            value={formData.accessibility_info.additionalInfo}
            onChange={(e) => onAccessibilityChange('additionalInfo', e.target.value)}
            rows={2}
            placeholder="z.B. Rampe vorhanden, Aufzug verfügbar, etc."
          />
        </FormField>
      </div>
    </div>
  )
}
