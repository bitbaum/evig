'use client'

/**
 * Protocol Detail Client Component
 *
 * Renders structured notes with action item management.
 * Adapts to status: review (editable) vs finalized (read-only).
 */

import { Loader2, CheckCircle2, FileText, Trash2 } from 'lucide-react'
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

export default function ProtocolDetailClient(props: ProtocolDetailProps) {
  const router = useRouter()
  const { protocol, actionLinks, teamMembers, decisionVotes, decisionOutcomes, currentUserId, isProtocolCreator, isSuperAdmin } = props
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
                  <button
                    onClick={() => setShowFinalizeDialog(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Protokoll abschliessen
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

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
