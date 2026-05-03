import { PROTOCOL_VISIBILITY_LABELS } from '@/config/protocols'
import Heading from '@/components/admin/AdminHeading'
import type { ProtocolVisibility } from '@/config/protocols'
import { formatDateShort } from '@/lib/date-formats'

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
        <button onClick={onReset} className="text-sm text-info-600 hover:text-info-800">
          Ändern
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <Heading level={2} className="text-lg text-neutral-900">Details</Heading>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
          Titel <span className="text-error-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={values.title}
          onChange={onChange}
          required
          maxLength={200}
          placeholder="z.B. Teamsitzung 10. Februar 2026"
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
        />
      </div>

      <div>
        <label htmlFor="meeting_date" className="block text-sm font-medium text-neutral-700 mb-1">
          Datum <span className="text-error-500">*</span>
        </label>
        <input
          type="date"
          id="meeting_date"
          name="meeting_date"
          value={values.meeting_date}
          onChange={onChange}
          required
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
        />
      </div>

      <div>
        <label htmlFor="visibility" className="block text-sm font-medium text-neutral-700 mb-1">
          Sichtbarkeit
        </label>
        <select
          id="visibility"
          name="visibility"
          value={values.visibility}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-info-500"
        >
          {Object.entries(PROTOCOL_VISIBILITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
