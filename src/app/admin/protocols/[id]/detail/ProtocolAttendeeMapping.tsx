'use client'

/** Personen-Zuordnung slice — maps detected attendee names to team accounts. */

import type { Dispatch, SetStateAction } from 'react'
import { Loader2, CheckCircle2, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import type { ProtocolDetailProps } from '@/components/admin/protocols'
import type { StructuredNotes } from '@/lib/schemas/protocols'

interface ProtocolAttendeeMappingProps {
  notes: StructuredNotes
  teamMembers: ProtocolDetailProps['teamMembers']
  unmappedAttendees: string[]
  allMapped: boolean
  attendeeMapping: Record<string, string>
  setAttendeeMapping: Dispatch<SetStateAction<Record<string, string>>>
  mappingDirty: boolean
  setMappingDirty: Dispatch<SetStateAction<boolean>>
  savingMapping: boolean
  handleSaveMapping: () => void
}

export function ProtocolAttendeeMapping({
  notes,
  teamMembers,
  unmappedAttendees,
  allMapped,
  attendeeMapping,
  setAttendeeMapping,
  mappingDirty,
  setMappingDirty,
  savingMapping,
  handleSaveMapping,
}: ProtocolAttendeeMappingProps) {
  return (
    <div className="rounded-lg border border-default bg-surface-base p-4">
      <div className="flex items-start gap-3">
        <UserCheck className="w-5 h-5 shrink-0 mt-0.5 text-text-tertiary" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold mb-1 text-text-primary">
            {allMapped
              ? 'Wer war dabei? — alle zugeordnet'
              : `Wer war dabei? (${unmappedAttendees.length} ${unmappedAttendees.length === 1 ? 'Name' : 'Namen'} noch offen)`
            }
          </h3>
          {!allMapped && (
            <p className="text-xs text-text-tertiary mb-3">
              Die KI hat diese Namen im Gespräch gehört. Wähle das passende
              Team-Konto: die Person wird als Teilnehmer gespeichert und ihre
              Aufgaben werden ihr direkt zugewiesen. Unklare Namen kannst du
              offen lassen.
            </p>
          )}
          <div className="space-y-2">
            {notes.detected_attendees.map((name) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary min-w-[120px] font-medium">{name}</span>
                <Select
                  value={attendeeMapping[name] || ''}
                  onChange={(e) => {
                    setAttendeeMapping(prev => ({ ...prev, [name]: e.target.value }))
                    setMappingDirty(true)
                  }}
                  className="w-auto"
                >
                  <option value="">— Nicht zugeordnet —</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.open_task_count > 0 ? ` (${m.open_task_count} Aufgaben)` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </div>
          {mappingDirty && (
            <Button
              onClick={handleSaveMapping}
              disabled={savingMapping}
              variant="primary"
              size="sm"
              className="mt-3 gap-2"
            >
              {savingMapping
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <CheckCircle2 className="w-3.5 h-3.5" />
              }
              Zuordnung speichern
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
