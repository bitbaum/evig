'use client'

import { FileText } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/admin/AdminHeading'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopPrerequisitesSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-6">
      <Heading level={2} className="text-lg text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5" />
        Voraussetzungen & Materialien
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Voraussetzungen
          </label>
          <textarea
            value={formData.prerequisites}
            onChange={(e) => onInputChange('prerequisites', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Welche Vorkenntnisse werden empfohlen?"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Erforderliche Materialien
          </label>
          <textarea
            value={formData.materials}
            onChange={(e) => onInputChange('materials', e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Welche Materialien benötigen die Teilnehmer?"
          />
        </div>
      </div>
    </div>
  )
}
