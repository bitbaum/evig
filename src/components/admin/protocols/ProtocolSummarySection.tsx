import { Loader2, CheckCircle2, MessageSquare } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface Props {
  notes: StructuredNotes
  isReview: boolean
  teamMembers: Array<{ id: string; name: string; open_task_count: number }>
  attendeeMapping: Record<string, string>
  mappingDirty: boolean
  savingMapping: boolean
  onMappingChange: (name: string, memberId: string) => void
  onSaveMapping: () => void
}

export function ProtocolSummarySection({
  notes,
  isReview,
  teamMembers,
  attendeeMapping,
  mappingDirty,
  savingMapping,
  onMappingChange,
  onSaveMapping,
}: Props) {
  return (
    <div id="protocol-step-review" className="bg-white rounded-lg border p-6">
      <Heading level={2} className="text-lg text-neutral-900 mb-3">
        <MessageSquare className="w-5 h-5 inline mr-2 text-neutral-400" />
        Zusammenfassung
      </Heading>
      <p className="text-neutral-700">{notes.summary}</p>

      {notes.detected_attendees && notes.detected_attendees.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm font-medium text-neutral-600 mb-2">
            Erkannte Teilnehmer:
          </p>
          {isReview ? (
            <div className="space-y-2">
              {notes.detected_attendees.map((name) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-700 min-w-[120px]">{name}</span>
                  <select
                    value={attendeeMapping[name] || ''}
                    onChange={(e) => onMappingChange(name, e.target.value)}
                    className="text-sm border rounded px-2 py-1 text-neutral-600"
                  >
                    <option value="">— Nicht zugeordnet —</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name}{m.open_task_count > 0 ? ` (${m.open_task_count} Aufgaben)` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {mappingDirty && (
                <button
                  onClick={onSaveMapping}
                  disabled={savingMapping}
                  className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-info-600 text-white rounded-lg hover:bg-info-700 disabled:opacity-50"
                >
                  {savingMapping ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Zuordnung speichern
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              {notes.detected_attendees.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
