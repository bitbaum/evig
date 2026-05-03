'use client'

import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_LABELS,
  EMPLOYMENT_TYPE_OPTIONS,
  EMPLOYMENT_TYPE_LABELS,
  type Department,
  type EmploymentType,
} from '@/config/team'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string | boolean) => void
}

export function TeamBasicInfoSection({ form, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Position
        </label>
        <input
          type="text"
          value={form.position}
          onChange={(e) => onChange('position', e.target.value)}
          placeholder="z.B. Techniker, Werkstattleiter"
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Abteilung
        </label>
        <select
          value={form.department}
          onChange={(e) => onChange('department', e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        >
          <option value="">Keine Abteilung</option>
          {DEPARTMENT_OPTIONS.map(dept => (
            <option key={dept} value={dept}>
              {DEPARTMENT_LABELS[dept as Department]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Beschäftigungsart
        </label>
        <select
          value={form.employment_type}
          onChange={(e) => onChange('employment_type', e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        >
          <option value="">Auswählen...</option>
          {EMPLOYMENT_TYPE_OPTIONS.map(type => (
            <option key={type} value={type}>
              {EMPLOYMENT_TYPE_LABELS[type as EmploymentType]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Startdatum
        </label>
        <input
          type="date"
          value={form.start_date}
          onChange={(e) => onChange('start_date', e.target.value)}
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
          Vertragsstunden (pro Woche)
        </label>
        <input
          type="number"
          min="0"
          max="100"
          value={form.contract_hours}
          onChange={(e) => onChange('contract_hours', e.target.value)}
          placeholder="z.B. 20"
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            className="rounded border-neutral-300 dark:border-neutral-600"
          />
          Aktiv
        </label>
        <p className="text-xs text-neutral-500 mt-1">
          Inaktive Profile werden in der Liste ausgegraut angezeigt
        </p>
      </div>
    </div>
  )
}
