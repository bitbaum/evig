'use client'

import { useState, useMemo } from 'react'
import { Users, Pencil, X, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminInteractive } from '@/lib/admin-ui'

interface TeamMember {
  id: string
  name: string
}

interface ProtocolAttendeesCardProps {
  protocolId: string
  attendees: string[]
  attendeeNames: Record<string, string>
  teamMembers: TeamMember[]
  isReview: boolean
}

export function ProtocolAttendeesCard({
  protocolId,
  attendees,
  attendeeNames,
  teamMembers,
  isReview,
}: ProtocolAttendeesCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState<string[]>(attendees)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return teamMembers
    const q = search.toLowerCase()
    return teamMembers.filter(m => m.name.toLowerCase().includes(q))
  }, [teamMembers, search])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const result = await apiFetch<unknown>(`/api/protocols/${protocolId}`, {
        method: 'PATCH',
        body: { attendees: selected },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern')
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface-base rounded-lg border border-default p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-text-muted" />
          <h3 className="text-sm font-semibold text-text-primary">
            Teilnehmer ({attendees.length})
          </h3>
        </div>
        {isReview && !editing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelected(attendees); setSearch(''); setEditing(true) }}
            className="flex items-center gap-1 text-xs text-action hover:text-action h-auto px-0 bg-transparent hover:bg-transparent"
          >
            <Pencil className="w-3 h-3" />
            Bearbeiten
          </Button>
        )}
        {editing && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary h-auto px-0 bg-transparent hover:bg-transparent"
            >
              <X className="w-3 h-3" />
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving} size="sm" className="gap-1 text-xs h-7 px-2">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Speichern
            </Button>
          </div>
        )}
      </div>

      {!editing && (
        <div className="flex flex-wrap gap-1">
          {attendees.length > 0
            ? attendees.map((uid) => (
                <span
                  key={uid}
                  className="inline-flex px-2 py-0.5 text-xs rounded-full bg-surface-raised dark:bg-surface-base/6 text-text-secondary"
                >
                  {attendeeNames[uid] || 'Unbekannt'}
                </span>
              ))
            : <p className="text-xs text-text-muted">Keine Teilnehmer eingetragen</p>
          }
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen..."
            className="py-1 text-sm h-8"
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-sm ${adminInteractive.rowHoverSubtle} cursor-pointer text-sm text-text-secondary`}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(member.id)}
                  onChange={() =>
                    setSelected(prev =>
                      prev.includes(member.id)
                        ? prev.filter(id => id !== member.id)
                        : [...prev, member.id]
                    )
                  }
                  className="rounded-sm border-default text-action focus:ring-action"
                />
                {member.name}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-xs text-text-muted px-2 py-1">Keine Treffer</p>
            )}
          </div>
          {error && <p className="text-xs text-error-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
