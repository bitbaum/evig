'use client'

import { Users } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopParticipantsSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Teilnehmer & Preis
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Maximale Teilnehmerzahl
          </label>
          <input
            type="number"
            value={formData.maxParticipants}
            onChange={(e) => onInputChange('maxParticipants', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="12"
            min="1"
            max="50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preis (CHF) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => onInputChange('price', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="120.00"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="draft">Entwurf</option>
            <option value="published">Veröffentlicht</option>
          </select>
        </div>
      </div>
    </div>
  )
}
