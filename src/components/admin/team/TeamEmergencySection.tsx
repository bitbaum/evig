'use client'

import {
  EMERGENCY_RELATION_OPTIONS,
  EMERGENCY_RELATION_LABELS,
  type EmergencyRelation,
} from '@/config/team'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string) => void
}

export function TeamEmergencySection({ form, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          type="text"
          value={form.emergency_contact_name}
          onChange={(e) => onChange('emergency_contact_name', e.target.value)}
          placeholder="Vor- und Nachname"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Telefon
        </label>
        <input
          type="tel"
          value={form.emergency_contact_phone}
          onChange={(e) => onChange('emergency_contact_phone', e.target.value)}
          placeholder="+41 79 123 45 67"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Beziehung
        </label>
        <select
          value={form.emergency_contact_relation}
          onChange={(e) => onChange('emergency_contact_relation', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Auswählen...</option>
          {EMERGENCY_RELATION_OPTIONS.map(relation => (
            <option key={relation} value={relation}>
              {EMERGENCY_RELATION_LABELS[relation as EmergencyRelation]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
