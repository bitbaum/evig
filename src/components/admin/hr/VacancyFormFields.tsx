'use client'

import {
  ROLE_TRACK_OPTIONS,
  ROLE_TRACK_LABELS,
  VACANCY_STATUS_OPTIONS,
  VACANCY_STATUS_LABELS,
  type RoleTrack,
  type VacancyStatus,
} from '@/config/hr-vacancies'
import { DEPARTMENT_OPTIONS, DEPARTMENT_LABELS, type Department } from '@/config/team'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface Props {
  statusFilter: string
  searchQuery: string
  onStatusChange: (value: string) => void
  onSearchChange: (value: string) => void
}

export function VacancyFilters({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="sm:w-48"
      >
        <option value="">Alle Status</option>
        {VACANCY_STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {VACANCY_STATUS_LABELS[s as VacancyStatus]}
          </option>
        ))}
      </Select>
      <Input
        type="search"
        placeholder="Suche nach Titel oder Slug…"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />
    </div>
  )
}

interface FormProps {
  form: {
    title: string
    summary: string
    description: string
    role_track: RoleTrack
    department: string
    location: string
    remote_ok: boolean
    hours_per_week: string
    start_date: string
    application_deadline: string
    compensation_public_text: string
    show_on_get_involved: boolean
    seo_title: string
    seo_description: string
  }
  onChange: (field: string, value: string | boolean) => void
  showAdvanced?: boolean
}

export function VacancyFormFields({ form, onChange, showAdvanced = false }: FormProps) {
  return (
    <div className="space-y-4">
      <FormField label="Titel *" htmlFor="title">
        <Input
          id="title"
          value={form.title}
          onChange={(e) => onChange('title', e.target.value)}
          required
        />
      </FormField>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Rollentyp *" htmlFor="role_track">
          <Select
            id="role_track"
            value={form.role_track}
            onChange={(e) => onChange('role_track', e.target.value)}
            required
          >
            {ROLE_TRACK_OPTIONS.map((track) => (
              <option key={track} value={track}>
                {ROLE_TRACK_LABELS[track as RoleTrack]}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Abteilung" htmlFor="department">
          <Select
            id="department"
            value={form.department}
            onChange={(e) => onChange('department', e.target.value)}
          >
            <option value="">Keine</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {DEPARTMENT_LABELS[dept as Department]}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Kurzbeschreibung" htmlFor="summary">
        <Input
          id="summary"
          value={form.summary}
          onChange={(e) => onChange('summary', e.target.value)}
          maxLength={500}
        />
      </FormField>

      <FormField label="Beschreibung *" htmlFor="description">
        <Textarea
          id="description"
          rows={10}
          value={form.description}
          onChange={(e) => onChange('description', e.target.value)}
          required
        />
      </FormField>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Ort" htmlFor="location">
          <Input
            id="location"
            value={form.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="z.B. Zürich / Remote"
          />
        </FormField>
        <FormField label="Stunden/Woche" htmlFor="hours_per_week">
          <Input
            id="hours_per_week"
            type="number"
            min={1}
            max={80}
            value={form.hours_per_week}
            onChange={(e) => onChange('hours_per_week', e.target.value)}
          />
        </FormField>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <FormField label="Startdatum" htmlFor="start_date">
          <Input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={(e) => onChange('start_date', e.target.value)}
          />
        </FormField>
        <FormField label="Bewerbungsfrist" htmlFor="application_deadline">
          <Input
            id="application_deadline"
            type="datetime-local"
            value={form.application_deadline}
            onChange={(e) => onChange('application_deadline', e.target.value)}
          />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.remote_ok}
          onChange={(e) => onChange('remote_ok', e.target.checked)}
          className="rounded-sm border-default"
        />
        Remote möglich
      </label>

      {showAdvanced && (
        <>
          <FormField label="Vergütung (öffentlich)" htmlFor="compensation_public_text">
            <Input
              id="compensation_public_text"
              value={form.compensation_public_text}
              onChange={(e) => onChange('compensation_public_text', e.target.value)}
              placeholder="z.B. nach Vereinbarung / unentgeltlich"
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.show_on_get_involved}
              onChange={(e) => onChange('show_on_get_involved', e.target.checked)}
              className="rounded-sm border-default"
            />
            Auf Get-Involved verlinken
          </label>
          <FormField label="SEO-Titel" htmlFor="seo_title">
            <Input
              id="seo_title"
              value={form.seo_title}
              onChange={(e) => onChange('seo_title', e.target.value)}
            />
          </FormField>
          <FormField label="SEO-Beschreibung" htmlFor="seo_description">
            <Input
              id="seo_description"
              value={form.seo_description}
              onChange={(e) => onChange('seo_description', e.target.value)}
            />
          </FormField>
        </>
      )}
    </div>
  )
}
