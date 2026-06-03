'use client'

/**
 * Protocol Detail Client Component — Redesigned
 *
 * Information hierarchy:
 *   1. Progress strip (where are we in the review flow?)
 *   2. Summary + AI chat (the content)
 *   3. Attendee mapping callout (only when needed)
 *   4. Topics (collapsed accordion)
 *   5. Action items (primary CTA area)
 *   6. Follow-ups
 *   7. Finalize / delete buttons
 */

import { useState, useMemo } from 'react'
import { Loader2, CheckCircle2, FileText, Trash2, AlertCircle, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useProtocolDetail,
  ProtocolReprocessSection,
  ProtocolDraftInput,
  ProtocolTopicsSection,
  ProtocolActionItemsList,
  ProtocolFollowUps,
  ProtocolProgressStrip,
  ProtocolAIChat,
} from '@/components/admin/protocols'
import type { ProtocolDetailProps } from '@/components/admin/protocols'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { useRouter } from 'next/navigation'
import Heading from '@/components/admin/AdminHeading'
import { getProtocolReviewChecklist } from '@/lib/protocols/review'

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

  const reviewChecklist = useMemo(() => getProtocolReviewChecklist({
    status: protocol.status,
    hasRawInput: Boolean(protocol.raw_transcript),
    notes,
    actionLinks,
    decisionVotes,
    decisionOutcomes,
  }), [protocol.status, protocol.raw_transcript, notes, actionLinks, decisionVotes, decisionOutcomes])

  // Detected attendees that aren't yet mapped to a team member.
  // Dep on `notes` directly (not `notes?.detected_attendees`) — the
  // React Compiler eslint rule preserve-manual-memoization couldn't
  // verify the optional-chained dep against what the compiler would
  // infer, so it flagged the useMemo. Depending on the parent object
  // and re-deriving the array inside the body satisfies the rule and
  // doesn't change behavior — both `notes` and `notes.detected_attendees`
  // change together in practice (the parent owns the whole `notes`
  // object's identity).
  const unmappedAttendees = useMemo(() => {
    if (!notes?.detected_attendees) return []
    return notes.detected_attendees.filter(name => !attendeeMapping[name])
  }, [notes, attendeeMapping])

  const allMapped = unmappedAttendees.length === 0 && (notes?.detected_attendees?.length ?? 0) > 0

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p>{error}</p>
            {initialProcessingError?.retryable && (
              <p className="text-sm mt-1 opacity-80">
                Nutze &ldquo;Erneut verarbeiten&rdquo; weiter unten, um es erneut zu versuchen.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Progress Strip — replaces the old wall-of-cards checklist */}
      {(isReview || isFinalized) && (
        <ProtocolProgressStrip items={reviewChecklist} />
      )}

      {/* Processing Spinner */}
      {protocol.status === PROTOCOL_STATUSES.PROCESSING && (
        <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-warning-500 mx-auto mb-3" />
          <p className="font-medium text-warning-800 dark:text-warning-300">Wird verarbeitet…</p>
          <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
            Die KI strukturiert das Transkript. Dies dauert einige Sekunden.
          </p>
        </div>
      )}

      {/* Draft input (no notes yet) */}
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

      {/* Main content — only when structured notes exist */}
      {notes && (
        <>
          {/* 1. Summary */}
          <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08] p-5">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              Zusammenfassung
            </h2>
            <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {notes.summary}
            </p>
          </div>

          {/* 2. AI Chat — collapsed by default */}
          <ProtocolAIChat title={protocol.title} notes={notes} />

          {/* 3. Attendee mapping callout — advisory, not blocking. Per the
              admin UX audit: this used to scream WARNING (yellow/red) when in
              reality it's optional metadata. Subtle neutral border now; staff
              can still map names but the visual weight matches the actual
              criticality (finalization isn't blocked, task assignments just
              fall back to manual). */}
          {isReview && notes.detected_attendees && notes.detected_attendees.length > 0 && (
            <div className="rounded-lg border border-neutral-200 dark:border-white/[0.06] bg-white dark:bg-neutral-900 p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-500 dark:text-neutral-400" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1 text-neutral-900 dark:text-white">
                    {allMapped
                      ? 'Alle Personen zugeordnet'
                      : `Erkannte Personen (${unmappedAttendees.length} noch offen)`
                    }
                  </h3>
                  {!allMapped && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                      Optional. Zuordnung erlaubt automatische Aufgaben­zuweisung; sonst manuell.
                    </p>
                  )}
                  <div className="space-y-2">
                    {notes.detected_attendees.map((name) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-sm text-neutral-700 dark:text-neutral-300 min-w-[120px] font-medium">{name}</span>
                        <select
                          value={attendeeMapping[name] || ''}
                          onChange={(e) => {
                            setAttendeeMapping(prev => ({ ...prev, [name]: e.target.value }))
                            setMappingDirty(true)
                          }}
                          className="text-sm border border-neutral-300 dark:border-white/[0.12] rounded-lg px-2.5 py-1.5 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
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
          )}

          {/* 4. Topics — all collapsed by default for cleaner view */}
          <ProtocolTopicsSection
            topics={notes.topics}
            expandedTopics={expandedTopics}
            onToggleTopic={toggleTopic}
          />

          {/* 5. Action Items — primary CTA section */}
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

          {/* 6. Follow-ups */}
          {notes.follow_ups && notes.follow_ups.length > 0 && (
            <ProtocolFollowUps followUps={notes.follow_ups} />
          )}

          {/* 7. Reprocess (edge case — collapsed by default) */}
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

          {/* 8. Footer actions */}
          {(isReview || isProtocolCreator || isSuperAdmin) && (
            <div id="protocol-step-done" className="flex items-center justify-between pt-2">
              <div>
                {(isProtocolCreator || isSuperAdmin) && (
                  <Button
                    variant="destructive-outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Löschen
                  </Button>
                )}
              </div>
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
          )}
        </>
      )}

      {/* Empty state */}
      {!notes && !isDraft && protocol.status !== PROTOCOL_STATUSES.PROCESSING && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08] p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            Keine strukturierten Notizen
          </Heading>
          <p className="text-neutral-500 dark:text-neutral-400">
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
