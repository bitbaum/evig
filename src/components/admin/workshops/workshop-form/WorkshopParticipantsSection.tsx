'use client'

import { Users } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopParticipantsSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-surface-base rounded-xl shadow-sm border border-subtle dark:border-white/[0.06] p-6">
      <Heading level={2} className="text-lg text-text-primary mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Teilnehmer & Preis
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField label="Maximale Teilnehmerzahl">
          <Input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => onInputChange('maxParticipants', e.target.value)}
            placeholder="12"
            min="1"
            max="50"
          />
        </FormField>

        <FormField label="Preis (CHF)" required>
          <Input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            placeholder="120.00"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Status">
          <Select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
          >
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </Select>
        </FormField>
      </div>
    </div>
  )
}
