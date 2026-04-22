'use client'

/**
 * Protocol Detail Client Component
 *
 * Renders structured notes with action item management.
 * Adapts to status: review (editable) vs finalized (read-only).
 */

import { useState, useMemo } from 'react'
import { Loader2, CheckCircle2, FileText, Trash2, Users, Pencil, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useProtocolDetail,
  ProtocolReprocessSection,
  ProtocolDraftInput,
  ProtocolSummarySection,
  ProtocolTopicsSection,
  ProtocolActionItemsList,
  ProtocolFollowUps,
} from '@/components/admin/protocols'
import type { ProtocolDetailProps } from '@/components/admin/protocols'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/utils/error'
import Heading from '@/components/admin/AdminHeading'

export default function ProtocolDetailClient(props: ProtocolDetailProps) {
  const router = useRouter()
  const { protocol, actionLinks, teamMembers, decisionVotes, decisionOutcomes, currentUserId, isProtocolCreator, isSuperAdmin } = props

  // Attendee editing state
  const [editingAttendees, setEditingAttendees] = useState(false)
  const [editedAttendees, setEditedAttendees] = useState<string[]>(protocol.attendees || [])
  const [attendeeSearch, setAttendeeSearch] = useState('')
  const [savingAttendees, setSavingAttendees] = useState(false)
  const [attendeeError, setAttendeeError] = useState<string | null>(null)

  const filteredTeamMembersForEdit = useMemo(() => {
    if (!attendeeSearch.trim()) return teamMembers
    const search = attendeeSearch.toLowerCase()
    return teamMembers.filter(m => m.name.toLowerCase().includes(search))
  }, [teamMembers, attendeeSearch])

  const handleSaveAttendees = async () => {
    setSavingAttendees(true)
    setAttendeeError(null)
    try {
      const res = await fetch(`/api/protocols/${protocol.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees: editedAttendees }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Fehler beim Speichern')
      setEditingAttendees(false)
      router.refresh()
    } catch (err) {
      setAttendeeError(getErrorMessage(err))
    } finally {
      setSavingAttendees(false)
    }
  }

  const {
    notes,
    isReview,
    isDraft,
    isFinalized,
    error,
    initialProcessingError,
    workflowProgress,
    currentStepIndex,
    scrollToStep,
    expandedTopics,
    toggleTopic,
    attendeeMapping,
    setAttendeeMapping,
    mappingDirty,
    setMappingDirty,
    savingMapping,
    handleSaveMapping,
    transcript,
    setTranscript,
    audioFile,
    processing,
    handleProcess,
    handleFileUpload,
    handleAudioFileSelect,
    getReprocessMinLength,
    linkedActionIds,
    unlinkedTaskItems,
    creatingTask,
    handleCreateTask,
    bulkCreatingTasks,
    bulkTaskErrors,
    handleCreateAllTasks,
    finalizing,
    showFinalizeDialog,
    setShowFinalizeDialog,
    handleFinalize,
    deleting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
  } = useProtocolDetail(props)

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p>{error}</p>
          {initialProcessingError?.retryable && (
            <p className="text-sm mt-1 text-red-600">Sie können das Transkript unten direkt erneut verarbeiten.</p>
          )}
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isFinalized ? 'bg-green-100 text-green-800' :
          protocol.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
          isDraft ? 'bg-gray-100 text-gray-800' :
          'bg-blue-100 text-blue-800'
        }`}>
          {isFinalized ? 'Abgeschlossen' :
           protocol.status === 'processing' ? 'Wird verarbeitet...' :
           isDraft ? 'Entwurf' :
           'Zur Überprüfung'}
        </span>
        {unlinkedTaskItems.length > 0 && isReview && (
          <span className="text-sm text-amber-600 font-medium">
            {unlinkedTaskItems.length} Aufgabe{unlinkedTaskItems.length !== 1 ? 'n' : ''} noch nicht verknüpft
          </span>
        )}
      </div>

      {/* Edit Attendees (review phase) */}
      {isReview && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Teilnehmer ({protocol.attendees?.length || 0})
              </span>
            </div>
            {!editingAttendees ? (
              <button
                onClick={() => {
                  setEditedAttendees(protocol.attendees || [])
                  setAttendeeSearch('')
                  setEditingAttendees(true)
                }}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Pencil className="w-3.5 h-3.5" />
                Teilnehmer bearbeiten
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingAttendees(false)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <X className="w-3.5 h-3.5" />
                  Abbrechen
                </button>
                <Button
                  onClick={handleSaveAttendees}
                  disabled={savingAttendees}
                  size="sm"
                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                >
                  {savingAttendees ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Speichern
                </Button>
              </div>
            )}
          </div>

          {attendeeError && (
            <p className="mt-2 text-sm text-red-600">{attendeeError}</p>
          )}

          {editingAttendees && (
            <div className="mt-3 space-y-2">
              <input
                type="text"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                placeholder="Teilnehmer suchen..."
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                {filteredTeamMembersForEdit.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={editedAttendees.includes(member.id)}
                      onChange={() => {
                        setEditedAttendees(prev =>
                          prev.includes(member.id)
                            ? prev.filter(id => id !== member.id)
                            : [...prev, member.id]
                        )
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {member.name}
                  </label>
                ))}
                {filteredTeamMembersForEdit.length === 0 && (
                  <p className="text-sm text-gray-500 px-2 py-1">Keine Teilnehmer gefunden</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isReview && (
        <ProtocolReprocessSection
          inputMethod={protocol.input_method}
          transcript={transcript}
          audioFile={audioFile}
          processing={processing}
          reprocessMinLength={getReprocessMinLength()}
          onTranscriptChange={setTranscript}
          onAudioFileSelect={handleAudioFileSelect}
          onFileUpload={handleFileUpload}
          onProcess={handleProcess}
        />
      )}

      {isDraft && !notes && (
        <ProtocolDraftInput
          inputMethod={protocol.input_method}
          transcript={transcript}
          audioFile={audioFile}
          processing={processing}
          onTranscriptChange={setTranscript}
          onAudioFileSelect={handleAudioFileSelect}
          onFileUpload={handleFileUpload}
          onProcess={handleProcess}
        />
      )}

      {protocol.status === PROTOCOL_STATUSES.PROCESSING && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto mb-3" />
          <p className="font-medium text-yellow-800">Wird verarbeitet...</p>
          <p className="text-sm text-yellow-700 mt-1">
            Die KI strukturiert das Transkript. Dies kann einige Sekunden dauern.
          </p>
        </div>
      )}

      {notes && (
        <>
          <ProtocolSummarySection
            notes={notes}
            isReview={isReview}
            teamMembers={teamMembers}
            attendeeMapping={attendeeMapping}
            mappingDirty={mappingDirty}
            savingMapping={savingMapping}
            onMappingChange={(name, memberId) => {
              setAttendeeMapping(prev => ({ ...prev, [name]: memberId }))
              setMappingDirty(true)
            }}
            onSaveMapping={handleSaveMapping}
          />

          <ProtocolTopicsSection
            topics={notes.topics}
            expandedTopics={expandedTopics}
            onToggleTopic={toggleTopic}
          />

          <ProtocolActionItemsList
            notes={notes}
            actionLinks={actionLinks}
            linkedActionIds={linkedActionIds}
            unlinkedTaskItems={unlinkedTaskItems}
            isReview={isReview}
            isFinalized={isFinalized}
            protocolId={protocol.id}
            protocolTitle={protocol.title}
            meetingDate={protocol.meeting_date}
            attendeeCount={protocol.attendees?.length || 0}
            creatingTask={creatingTask}
            bulkCreatingTasks={bulkCreatingTasks}
            bulkTaskErrors={bulkTaskErrors}
            decisionVotes={decisionVotes}
            decisionOutcomes={decisionOutcomes}
            currentUserId={currentUserId}
            isProtocolCreator={isProtocolCreator}
            onCreateTask={handleCreateTask}
            onCreateAllTasks={handleCreateAllTasks}
            onRefresh={() => router.refresh()}
          />

          {notes.follow_ups && notes.follow_ups.length > 0 && (
            <ProtocolFollowUps followUps={notes.follow_ups} />
          )}

          {(isReview || (isProtocolCreator || isSuperAdmin)) && (
            <div id="protocol-step-done" className="flex justify-between pt-4">
              <div>
                {(isProtocolCreator || isSuperAdmin) && (
                  <button
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </button>
                )}
              </div>
              <div>
                {isReview && (
                  <Button
                    onClick={() => setShowFinalizeDialog(true)}
                    className="gap-2 px-6"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Protokoll abschliessen
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!notes && !isDraft && protocol.status !== 'processing' && (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-gray-900 mb-2">
            Keine strukturierten Notizen
          </Heading>
          <p className="text-gray-600">
            Füge ein Transkript hinzu, um es von der KI verarbeiten zu lassen.
          </p>
        </div>
      )}

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

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Protokoll löschen"
        message="Das Protokoll und alle verknüpften Daten (Abstimmungen, Entscheidungen) werden unwiderruflich gelöscht."
        itemName={protocol.title}
        confirmLabel="Löschen"
        cancelLabel="Abbrechen"
        variant="danger"
        isLoading={deleting}
        onConfirm={handleDelete}
        onClose={() => setShowDeleteDialog(false)}
      />
    </div>
  )
}
