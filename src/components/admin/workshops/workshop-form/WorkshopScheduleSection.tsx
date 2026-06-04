'use client'

import { Calendar } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopScheduleSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
      <Heading level={2} className="text-lg text-text-primary mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Termin & Ort
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Datum" required>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => onInputChange('date', e.target.value)}
            required
            aria-required="true"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Startzeit" required>
            <Input
              type="time"
              value={formData.startTime}
              onChange={(e) => onInputChange('startTime', e.target.value)}
              required
              aria-required="true"
            />
          </FormField>
          <FormField label="Endzeit" required>
            <Input
              type="time"
              value={formData.endTime}
              onChange={(e) => onInputChange('endTime', e.target.value)}
              required
              aria-required="true"
            />
          </FormField>
        </div>

        <FormField label="Ort" required>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            placeholder="z.B. Zürich, Werkstatt"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Dauer">
          <Input
            type="text"
            value={formData.duration}
            onChange={(e) => onInputChange('duration', e.target.value)}
            placeholder="z.B. 3 Stunden"
          />
        </FormField>

        <FormField label="Detaillierte Ortsbeschreibung" className="md:col-span-2">
          <Textarea
            value={formData.locationDetails}
            onChange={(e) => onInputChange('locationDetails', e.target.value)}
            rows={2}
            placeholder="Zusätzliche Informationen zur Anfahrt, Parkplatz, etc."
          />
        </FormField>
      </div>
    </div>
  )
}
