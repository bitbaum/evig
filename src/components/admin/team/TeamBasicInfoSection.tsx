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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string | boolean) => void
}

export function TeamBasicInfoSection({ form, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <FormField label="Position" htmlFor="position">
        <Input
          type="text"
          id="position"
          value={form.position}
          onChange={(e) => onChange('position', e.target.value)}
          placeholder="z.B. Techniker, Werkstattleiter"
        />
      </FormField>

      <FormField label="Abteilung" htmlFor="department">
        <Select
          id="department"
          value={form.department}
          onChange={(e) => onChange('department', e.target.value)}
        >
          <option value="">Keine Abteilung</option>
          {DEPARTMENT_OPTIONS.map(dept => (
            <option key={dept} value={dept}>
              {DEPARTMENT_LABELS[dept as Department]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Beschäftigungsart" htmlFor="employment_type">
        <Select
          id="employment_type"
          value={form.employment_type}
          onChange={(e) => onChange('employment_type', e.target.value)}
        >
          <option value="">Auswählen...</option>
          {EMPLOYMENT_TYPE_OPTIONS.map(type => (
            <option key={type} value={type}>
              {EMPLOYMENT_TYPE_LABELS[type as EmploymentType]}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Startdatum" htmlFor="start_date">
        <Input
          type="date"
          id="start_date"
          value={form.start_date}
          onChange={(e) => onChange('start_date', e.target.value)}
        />
      </FormField>

      <FormField label="Vertragsstunden (pro Woche)" htmlFor="contract_hours">
        <Input
          type="number"
          id="contract_hours"
          min="0"
          max="100"
          value={form.contract_hours}
          onChange={(e) => onChange('contract_hours', e.target.value)}
          placeholder="z.B. 20"
        />
      </FormField>

      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => onChange('is_active', e.target.checked)}
            className="rounded-sm border-neutral-300 dark:border-neutral-600"
          />
          Aktiv
        </label>
        <p className="text-xs text-text-tertiary mt-1">
          Inaktive Profile werden in der Liste ausgegraut angezeigt
        </p>
      </div>
    </div>
  )
}
