'use client'

/**
 * Compensation + employment lifecycle section.
 *
 * Surfaces the fields added by migration 080. Both hourly and salary
 * coexist because some employees have a salaried base plus paid
 * overtime, and volunteers have neither. The effective_date is the
 * "this rate started applying on" — the audit-trail entry in
 * compensation_history is created server-side from this field.
 *
 * Work state is shown as a clear segmented control (active / on_leave
 * / unavailable / inactive) — HR's most-frequent operation is "set X
 * to on_leave for two weeks", so the control belongs next to the
 * leave-dates fields rather than buried under is_active.
 */

import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import type { TeamProfileFormState } from './useTeamProfileForm'

interface Props {
  form: TeamProfileFormState
  onChange: (field: string, value: string | boolean | string[]) => void
  isSuperAdmin: boolean
}

const WORK_STATE_OPTIONS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'on_leave', label: 'Im Urlaub / Abwesend' },
  { value: 'unavailable', label: 'Vorübergehend nicht verfügbar' },
  { value: 'inactive', label: 'Inaktiv' },
] as const

// Swiss canton codes — abbreviated. The field accepts free text too
// (some setups use full canton names or custom payroll codes), but
// listing the official 26 abbreviations as datalist suggestions keeps
// HR fast on the common case.
const SWISS_CANTONS = [
  'AG', 'AI', 'AR', 'BE', 'BL', 'BS', 'FR', 'GE', 'GL', 'GR',
  'JU', 'LU', 'NE', 'NW', 'OW', 'SG', 'SH', 'SO', 'SZ', 'TG',
  'TI', 'UR', 'VD', 'VS', 'ZG', 'ZH',
] as const

export function TeamCompensationSection({ form, onChange, isSuperAdmin }: Props) {
  return (
    <div className="space-y-4">
      {/* Compensation — super-admin only because rate data is sensitive */}
      {isSuperAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Stundenlohn (CHF)" hint="Aktueller Satz">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.hourly_rate_chf}
                onChange={e => onChange('hourly_rate_chf', e.target.value)}
                placeholder="z. B. 35.00"
              />
            </FormField>
            <FormField label="Monatslohn (CHF)" hint="Aktueller Bruttolohn">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.salary_chf}
                onChange={e => onChange('salary_chf', e.target.value)}
                placeholder="z. B. 6500.00"
              />
            </FormField>
          </div>
          <FormField label="Lohn wirksam ab" hint="Datum, ab dem dieser Satz gilt (für die Lohnhistorie)">
            <Input
              type="date"
              value={form.salary_effective_date}
              onChange={e => onChange('salary_effective_date', e.target.value)}
            />
          </FormField>
        </>
      )}

      {/* Employment lifecycle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FormField label="Austrittsdatum" hint="Leer lassen, wenn die Person noch beschäftigt ist">
          <Input
            type="date"
            value={form.end_date}
            onChange={e => onChange('end_date', e.target.value)}
          />
        </FormField>
        <FormField label="Arbeitszustand" hint="Aktueller Status">
          <Select
            value={form.work_state || 'active'}
            onChange={e => onChange('work_state', e.target.value)}
          >
            {WORK_STATE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </FormField>
      </div>

      {form.end_date && (
        <FormField label="Austrittsgrund" hint="z. B. Pensionierung, Wechsel, Vertragsende">
          <Textarea
            value={form.exit_reason}
            onChange={e => onChange('exit_reason', e.target.value)}
            placeholder="Knapp halten — interne Notizen"
            rows={2}
            maxLength={1000}
          />
        </FormField>
      )}

      {/* Swiss employment metadata — super-admin only */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="AHV-Nummer" hint="13-stellige Sozialversicherungsnummer (756.xxxx.xxxx.xx)">
            <Input
              type="text"
              value={form.ahv_number}
              onChange={e => onChange('ahv_number', e.target.value)}
              placeholder="756.0000.0000.00"
              maxLength={50}
              autoComplete="off"
            />
          </FormField>
          <FormField label="Steuerkanton" hint="Wohnsitz-Kanton für die Quellensteuer">
            <Input
              type="text"
              value={form.canton_tax_code}
              onChange={e => onChange('canton_tax_code', e.target.value.toUpperCase())}
              placeholder="ZH"
              list="canton-codes"
              maxLength={20}
            />
            <datalist id="canton-codes">
              {SWISS_CANTONS.map(c => <option key={c} value={c} />)}
            </datalist>
          </FormField>
        </div>
      )}
    </div>
  )
}
