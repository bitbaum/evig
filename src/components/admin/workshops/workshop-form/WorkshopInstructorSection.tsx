'use client'

import { Users } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/admin/AdminHeading'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopInstructorSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Kursleiter
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Name des Kursleiters" required className="md:col-span-2">
          <Input
            type="text"
            value={formData.instructor}
            onChange={(e) => onInputChange('instructor', e.target.value)}
            placeholder="z.B. Hans Müller"
            required
            aria-required="true"
          />
        </FormField>

        <FormField label="Kurze Biografie des Kursleiters" className="md:col-span-2">
          <Textarea
            value={formData.instructorBio}
            onChange={(e) => onInputChange('instructorBio', e.target.value)}
            rows={3}
            placeholder="Kurze Vorstellung des Kursleiters und seiner Expertise"
          />
        </FormField>
      </div>
    </div>
  )
}
