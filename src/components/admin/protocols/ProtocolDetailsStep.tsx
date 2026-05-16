import { PROTOCOL_VISIBILITY_LABELS } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'
import type { ProtocolVisibility } from '@/config/protocols'
import { formatDateShort } from '@/lib/date-formats'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'

interface FormValues {
  title: string
  meeting_date: string
  visibility: ProtocolVisibility
}

interface Props {
  values: FormValues
  isComplete: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onReset: () => void
}

export function ProtocolDetailsStep({ values, isComplete, onChange, onReset }: Props) {
  if (isComplete) {
    return (
      <div className="bg-neutral-50 rounded-lg border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <span className="font-medium">{values.title}</span>
          <span className="text-neutral-400">·</span>
          <span>{formatDateShort(values.meeting_date)}</span>
          <span className="text-neutral-400">·</span>
          <span>{PROTOCOL_VISIBILITY_LABELS[values.visibility]}</span>
        </div>
        <button onClick={onReset} className="text-sm text-primary-600 hover:text-primary-800">
          Ändern
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <Heading level={2} className="text-lg text-neutral-900">Details</Heading>

      <FormField label="Titel" required htmlFor="title">
        <Input
          type="text"
          id="title"
          name="title"
          value={values.title}
          onChange={onChange}
          required
          maxLength={200}
          placeholder="z.B. Teamsitzung 10. Februar 2026"
        />
      </FormField>

      <FormField label="Datum" required htmlFor="meeting_date">
        <Input
          type="date"
          id="meeting_date"
          name="meeting_date"
          value={values.meeting_date}
          onChange={onChange}
          required
        />
      </FormField>

      <FormField label="Sichtbarkeit" htmlFor="visibility">
        <Select id="visibility" name="visibility" value={values.visibility} onChange={onChange}>
          {Object.entries(PROTOCOL_VISIBILITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </FormField>
    </div>
  )
}
