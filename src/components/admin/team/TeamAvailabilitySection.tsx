'use client'

import {
  CONTACT_METHOD_OPTIONS,
  CONTACT_METHOD_LABELS,
  type ContactMethod,
} from '@/config/team'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string) => void
}

export function TeamAvailabilitySection({ form, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Arbeitszeiten
        </label>
        <input
          type="text"
          value={form.working_hours}
          onChange={(e) => onChange('working_hours', e.target.value)}
          placeholder="z.B. Mo-Fr 9-17 Uhr"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Bevorzugte Kontaktart
        </label>
        <select
          value={form.preferred_contact}
          onChange={(e) => onChange('preferred_contact', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {CONTACT_METHOD_OPTIONS.map(method => (
            <option key={method} value={method}>
              {CONTACT_METHOD_LABELS[method as ContactMethod]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+41 79 123 45 67"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Allgemeine Verfügbarkeit
        </label>
        <textarea
          value={form.availability}
          onChange={(e) => onChange('availability', e.target.value)}
          rows={2}
          placeholder="z.B. Dienstags und Donnerstags ganztags, ansonsten nach Absprache"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </div>
  )
}
