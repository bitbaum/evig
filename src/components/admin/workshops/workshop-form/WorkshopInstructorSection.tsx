'use client'

import { Users } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopInstructorSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Kursleiter
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name des Kursleiters *
          </label>
          <input
            type="text"
            value={formData.instructor}
            onChange={(e) => onInputChange('instructor', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Hans Müller"
            required
            aria-required="true"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kurze Biografie des Kursleiters
          </label>
          <textarea
            value={formData.instructorBio}
            onChange={(e) => onInputChange('instructorBio', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Kurze Vorstellung des Kursleiters und seiner Expertise"
          />
        </div>
      </div>
    </div>
  )
}
