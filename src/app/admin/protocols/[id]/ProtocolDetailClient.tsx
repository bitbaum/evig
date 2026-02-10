'use client'

/**
 * Protocol Detail Client Component
 *
 * Renders structured notes with action item management.
 * Adapts to status: review (editable) vs finalized (read-only).
 *
 * Features:
 * - Topics expanded by default in review mode
 * - Confirm dialog for finalize
 * - Re-process section at top (collapsible)
 * - Action items with visual hierarchy (colored left borders)
 * - Attendee name mapping in review mode
 *
 * Created: 2026-02-10
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  ACTION_ITEM_TYPE_LABELS,
  ACTION_ITEM_TYPE_COLORS,
  PRIORITY_HINT_LABELS,
  INPUT_METHOD_LABELS,
} from '@/config/protocols'
import type { ProtocolDetail, ActionLinkRecord, StructuredNotes, DecisionVoteRecord, DecisionOutcomeRecord } from '@/lib/schemas/protocols'
import { getErrorMessage } from '@/lib/utils/error'
import DecisionActions from './DecisionActions'
import {
  Loader2,
  CheckCircle2,
  Wand2,
  ListChecks,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Upload,
} from 'lucide-react'

const ACTION_ITEM_BORDER_COLORS: Record<string, string> = {
  task: 'border-l-4 border-l-blue-400',
  decision: 'border-l-4 border-l-purple-400',
  info: 'border-l-4 border-l-gray-300',
}

interface Props {
  protocol: ProtocolDetail
  actionLinks: ActionLinkRecord[]
  teamMembers: Array<{ id: string; name: string }>
  decisionVotes: DecisionVoteRecord[]
  decisionOutcomes: DecisionOutcomeRecord[]
  currentUserId: string
  isProtocolCreator: boolean
}

export default function ProtocolDetailClient({ protocol, actionLinks, teamMembers, decisionVotes, decisionOutcomes, currentUserId, isProtocolCreator }: Props) {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [creatingTask, setCreatingTask] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')

  const notes = protocol.structured_notes as StructuredNotes | null
  const isReview = protocol.status === 'review'
  const isDraft = protocol.status === 'draft'
  const isFinalized = protocol.status === 'finalized'

  // Topics expanded by default in review mode
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () => new Set(isReview && notes?.topics ? notes.topics.map(t => t.id) : [])
  )

  // Expand all topics when transitioning to review (e.g. after AI processing)
  useEffect(() => {
    if (isReview && notes?.topics && expandedTopics.size === 0) {
      setExpandedTopics(new Set(notes.topics.map(t => t.id)))
    }
  }, [isReview, notes?.topics]) // eslint-disable-line react-hooks/exhaustive-deps

  // Attendee mapping state
  const [attendeeMapping, setAttendeeMapping] = useState<Record<string, string>>(() => {
    if (!notes?.action_items) return {}
    const mapping: Record<string, string> = {}
    for (const item of notes.action_items) {
      if (item.assigned_to_name && item.assigned_to_id) {
        mapping[item.assigned_to_name] = item.assigned_to_id
      }
    }
    return mapping
  })
  const [mappingDirty, setMappingDirty] = useState(false)

  // Track which action items already have linked tasks
  const linkedActionIds = new Set(actionLinks.map(l => l.action_item_id))

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSaveMapping = async () => {
    if (!notes || !mappingDirty) return

    setSavingMapping(true)
    setError(null)

    try {
      // Apply mapping to action items
      const updatedNotes = {
        ...notes,
        action_items: notes.action_items.map(item => {
          if (item.assigned_to_name && attendeeMapping[item.assigned_to_name]) {
            return { ...item, assigned_to_id: attendeeMapping[item.assigned_to_name] }
          }
          return item
        }),
      }

      const res = await fetch(`/api/protocols/${protocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ structured_notes: updatedNotes }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Speichern')
      }

      setMappingDirty(false)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingMapping(false)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setError(null)

    try {
      const res = await fetch(`/api/protocols/${protocol.id}/finalize`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Abschliessen')
      }

      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setFinalizing(false)
      setShowFinalizeDialog(false)
    }
  }

  const handleProcess = async () => {
    if (transcript.length < 50) return

    setProcessing(true)
    setError(null)

    try {
      const res = await fetch(`/api/protocols/${protocol.id}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_transcript: transcript }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Verarbeitung fehlgeschlagen')
      }

      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateTask = async (actionItem: StructuredNotes['action_items'][0]) => {
    setCreatingTask(actionItem.id)
    setError(null)

    try {
      const topicTitle = notes?.topics.find(t => t.id === actionItem.topic_id)?.title || ''

      const res = await fetch(`/api/protocols/${protocol.id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_item_id: actionItem.id,
          link_type: 'task',
          task_data: {
            title: actionItem.description,
            description: `Aus Protokoll: ${protocol.title} (${new Date(protocol.meeting_date).toLocaleDateString('de-CH')})${topicTitle ? `\nThema: ${topicTitle}` : ''}`,
            task_type: 'one_time',
            category: 'admin',
            priority: actionItem.priority_hint || 'normal',
          },
        }),
      })
      const data = await res.json()

      if (!data.success) {
        throw new Error(data.error || 'Fehler beim Erstellen der Aufgabe')
      }

      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreatingTask(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setTranscript(text)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Re-process section — shown at top for visibility in review mode */}
      {isReview && (
        <details className="bg-amber-50 rounded-lg border border-amber-200">
          <summary className="p-4 cursor-pointer text-sm font-medium text-amber-800 hover:text-amber-900">
            Nicht zufrieden? {protocol.input_method === 'tasks'
              ? 'Aufgaben erneut importieren'
              : protocol.input_method === 'notes'
              ? 'Notizen erneut verarbeiten'
              : 'Transkript erneut verarbeiten'}
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-amber-700">Überarbeitetes Transkript</label>
              <label className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                .txt hochladen
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              placeholder="Überarbeitetes Transkript einfügen..."
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <button
              onClick={handleProcess}
              disabled={processing || transcript.length < 50}
              className="flex items-center gap-2 px-4 py-2 text-sm text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Erneut verarbeiten
            </button>
          </div>
        </details>
      )}

      {/* Draft: Show transcript input */}
      {isDraft && !notes && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Transkript einfügen</h2>
          <p className="text-sm text-gray-600">
            Fügen Sie das Transkript ein, um es von der KI strukturieren zu lassen.
          </p>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Transkript</label>
            <label className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              .txt hochladen
              <input
                type="file"
                accept=".txt,.md,.text"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            maxLength={100000}
            placeholder="Transkript hier einfügen..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={handleProcess}
              disabled={processing || transcript.length < 50}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  KI verarbeitet...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Verarbeiten
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Processing indicator */}
      {protocol.status === 'processing' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto mb-3" />
          <p className="font-medium text-yellow-800">Wird verarbeitet...</p>
          <p className="text-sm text-yellow-700 mt-1">
            Die KI strukturiert das Transkript. Dies kann einige Sekunden dauern.
          </p>
        </div>
      )}

      {/* Structured Notes Content */}
      {notes && (
        <>
          {/* Summary */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              <MessageSquare className="w-5 h-5 inline mr-2 text-gray-400" />
              Zusammenfassung
            </h2>
            <p className="text-gray-700">{notes.summary}</p>

            {notes.detected_attendees && notes.detected_attendees.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Erkannte Teilnehmer:
                </p>
                {isReview ? (
                  <div className="space-y-2">
                    {notes.detected_attendees.map((name) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 min-w-[120px]">{name}</span>
                        <select
                          value={attendeeMapping[name] || ''}
                          onChange={(e) => {
                            setAttendeeMapping(prev => ({ ...prev, [name]: e.target.value }))
                            setMappingDirty(true)
                          }}
                          className="text-sm border rounded px-2 py-1 text-gray-600"
                        >
                          <option value="">— Nicht zugeordnet —</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {mappingDirty && (
                      <button
                        onClick={handleSaveMapping}
                        disabled={savingMapping}
                        className="mt-2 flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
                  <p className="text-sm text-gray-500">
                    {notes.detected_attendees.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Topics */}
          {notes.topics && notes.topics.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  Themen ({notes.topics.length})
                </h2>
              </div>
              <div className="divide-y">
                {notes.topics.map((topic) => (
                  <div key={topic.id} className="p-4">
                    <button
                      onClick={() => toggleTopic(topic.id)}
                      className="flex items-center gap-2 w-full text-left"
                    >
                      {expandedTopics.has(topic.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900">{topic.title}</span>
                    </button>
                    {expandedTopics.has(topic.id) && (
                      <div className="mt-3 ml-6 space-y-2">
                        <p className="text-gray-700 text-sm">{topic.discussion}</p>
                        {topic.outcome && (
                          <div className="bg-green-50 border border-green-200 rounded p-2">
                            <p className="text-sm text-green-800">
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Ergebnis: {topic.outcome}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {notes.action_items && notes.action_items.length > 0 && (
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900">
                  <ListChecks className="w-5 h-5 inline mr-2 text-gray-400" />
                  Aktionen ({notes.action_items.length})
                </h2>
              </div>
              <div className="divide-y">
                {notes.action_items.map((item) => {
                  const isLinked = linkedActionIds.has(item.id)
                  const link = actionLinks.find(l => l.action_item_id === item.id)
                  const borderClass = ACTION_ITEM_BORDER_COLORS[item.item_type] || ''

                  return (
                    <div key={item.id} className={`p-4 ${borderClass}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                                ACTION_ITEM_TYPE_COLORS[item.item_type] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {ACTION_ITEM_TYPE_LABELS[item.item_type]}
                            </span>
                            {item.priority_hint && (
                              <span className="text-xs text-gray-500">
                                {PRIORITY_HINT_LABELS[item.priority_hint] || item.priority_hint}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900">{item.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            {item.assigned_to_name && (
                              <span>Zuständig: {item.assigned_to_name}</span>
                            )}
                            {item.due_hint && (
                              <span>Fällig: {item.due_hint}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {isLinked && link ? (
                            <Link
                              href={`/admin/tasks/${link.linked_task_id}`}
                              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Verknüpft
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : item.item_type === 'task' && (isReview || isFinalized) ? (
                            <button
                              onClick={() => handleCreateTask(item)}
                              disabled={creatingTask === item.id}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                            >
                              {creatingTask === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <ListChecks className="w-4 h-4" />
                              )}
                              Aufgabe erstellen
                            </button>
                          ) : item.item_type === 'decision' && (isReview || isFinalized) ? (
                            <DecisionActions
                              protocolId={protocol.id}
                              actionItemId={item.id}
                              votes={decisionVotes.filter(v => v.action_item_id === item.id)}
                              outcome={decisionOutcomes.find(o => o.action_item_id === item.id)}
                              currentUserId={currentUserId}
                              isProtocolCreator={isProtocolCreator}
                              attendeeCount={protocol.attendees?.length || 0}
                              onRefresh={() => router.refresh()}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Follow-ups */}
          {notes.follow_ups && notes.follow_ups.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Offene Punkte aus früheren Sitzungen
              </h2>
              <ul className="space-y-2">
                {notes.follow_ups.map((fu, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`inline-flex px-2 py-0.5 text-xs rounded-full mt-0.5 ${
                      fu.status === 'erledigt' ? 'bg-green-100 text-green-800' :
                      fu.status === 'in Arbeit' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fu.status || 'offen'}
                    </span>
                    <span className="text-gray-700 text-sm">{fu.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Finalize Button (review status only) */}
          {isReview && (
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowFinalizeDialog(true)}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Protokoll abschliessen
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state for no notes and not draft */}
      {!notes && !isDraft && protocol.status !== 'processing' && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine strukturierten Notizen
          </h3>
          <p className="text-gray-600">
            Fügen Sie ein Transkript hinzu, um es von der KI verarbeiten zu lassen.
          </p>
        </div>
      )}

      {/* Finalize Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showFinalizeDialog}
        title="Protokoll abschliessen"
        message="Nach dem Abschliessen kann das Protokoll nicht mehr bearbeitet werden."
        confirmLabel="Abschliessen"
        cancelLabel="Abbrechen"
        variant="warning"
        isLoading={finalizing}
        onConfirm={handleFinalize}
        onClose={() => setShowFinalizeDialog(false)}
      />
    </div>
  )
}
