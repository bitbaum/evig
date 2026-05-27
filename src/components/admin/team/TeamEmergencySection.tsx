'use client'

import {
  EMERGENCY_RELATION_OPTIONS,
  EMERGENCY_RELATION_LABELS,
  type EmergencyRelation,
} from '@/config/team'
import { CONTACT } from '@/config/org'
import type { TeamProfileFormState } from './useTeamProfileForm'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string) => void
}

export function TeamEmergencySection({ form, onChange }: Props) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <FormField label="Name" htmlFor="emergency_contact_name">
        <Input
          type="text"
          id="emergency_contact_name"
          value={form.emergency_contact_name}
          onChange={(e) => onChange('emergency_contact_name', e.target.value)}
          placeholder="Vor- und Nachname"
        />
      </FormField>

      <FormField label="Telefon" htmlFor="emergency_contact_phone">
        <Input
          type="tel"
          id="emergency_contact_phone"
          value={form.emergency_contact_phone}
          onChange={(e) => onChange('emergency_contact_phone', e.target.value)}
          placeholder={CONTACT.phonePlaceholder}
        />
      </FormField>

      <FormField label="Beziehung" htmlFor="emergency_contact_relation">
        <Select
          id="emergency_contact_relation"
          value={form.emergency_contact_relation}
          onChange={(e) => onChange('emergency_contact_relation', e.target.value)}
        >
          <option value="">Auswählen...</option>
          {EMERGENCY_RELATION_OPTIONS.map(relation => (
            <option key={relation} value={relation}>
              {EMERGENCY_RELATION_LABELS[relation as EmergencyRelation]}
            </option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
