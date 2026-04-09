'use client'

import { Calendar } from 'lucide-react'
import type { WorkshopFormData } from './types'
import Heading from '@/components/ui/Heading'

interface Props {
  formData: WorkshopFormData
  onInputChange: (field: keyof WorkshopFormData, value: WorkshopFormData[keyof WorkshopFormData]) => void
}

export function WorkshopScheduleSection({ formData, onInputChange }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <Heading level={2} className="text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5" />
        Termin & Ort
      </Heading>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Datum *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => onInputChange('date', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
            aria-required="true"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Startzeit *
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => onInputChange('startTime', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endzeit *
            </label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => onInputChange('endTime', e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              aria-required="true"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ort *
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => onInputChange('location', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. Zürich, Werkstatt"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Dauer
          </label>
          <input
            type="text"
            value={formData.duration}
            onChange={(e) => onInputChange('duration', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="z.B. 3 Stunden"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detaillierte Ortsbeschreibung
          </label>
          <textarea
            value={formData.locationDetails}
            onChange={(e) => onInputChange('locationDetails', e.target.value)}
            rows={2}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Zusätzliche Informationen zur Anfahrt, Parkplatz, etc."
          />
        </div>
      </div>
    </div>
  )
}
