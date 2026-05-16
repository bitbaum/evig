'use client'

import { FileText } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopPrerequisitesSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-white/[0.06] p-6">
      <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Voraussetzungen & Materialien
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Voraussetzungen">
          <Textarea
            value={formData.prerequisites}
            onChange={(e) => onInputChange('prerequisites', e.target.value)}
            rows={3}
            placeholder="Welche Vorkenntnisse werden empfohlen?"
          />
        </FormField>

        <FormField label="Erforderliche Materialien">
          <Textarea
            value={formData.materials}
            onChange={(e) => onInputChange('materials', e.target.value)}
            rows={3}
            placeholder="Welche Materialien benötigen die Teilnehmer?"
          />
        </FormField>
      </div>
    </div>
  )
}
