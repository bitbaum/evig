'use client'

import { FileText } from 'lucide-react'
import { WORKSHOP_CATEGORIES } from '@/config/workshops'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import type { WorkshopFormData } from './types'
import { WORKSHOP_LEVEL_OPTIONS } from './types'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopBasicInfoSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle p-6">
      <Heading level={2} className="text-lg text-text-primary mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Grundinformationen
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Workshop-Titel" required className="md:col-span-2">
          <Input
            type="text"
            value={formData.title}
            onChange={(e) => onInputChange('title', e.target.value)}
            placeholder="z.B. Einführung in die Computer-Reparatur"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Kategorie" required>
          <Select
            value={formData.category}
            onChange={(e) => onInputChange('category', e.target.value)}
            required
            aria-required="true"
          >
            <option value="">Kategorie wählen</option>
            {WORKSHOP_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Schwierigkeitsgrad">
          <Select
            value={formData.level}
            onChange={(e) => onInputChange('level', e.target.value)}
          >
            {WORKSHOP_LEVEL_OPTIONS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Kurze Beschreibung" className="md:col-span-2">
          <Input
            type="text"
            value={formData.shortDescription}
            onChange={(e) => onInputChange('shortDescription', e.target.value)}
            placeholder="Eine kurze Zusammenfassung des Workshops"
          />
        </FormField>

        <FormField label="Detaillierte Beschreibung" required className="md:col-span-2">
          <Textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            rows={4}
            placeholder="Detaillierte Beschreibung des Workshop-Inhalts, Ablaufs und Nutzens"
            required
            aria-required="true"
          />
        </FormField>
      </div>
    </div>
  )
}
