'use client'

/**
 * Protocol Detail Client Component
 *
 * Information hierarchy follows the pipeline the user reads — source first,
 * derivations after, tools last:
 *   1. Progress strip (where are we in the review flow?)
 *   2. Zusammenfassung (executive overview)
 *   3. Quelle · Rohtranskript (the source, in-flow — not buried in the sidebar)
 *   4. Strukturierte Notizen / Themen (the transform of the source)
 *   5. Personen-Zuordnung (optional metadata, below the content it annotates)
 *   6. Aktionen & Entscheidungen (derived items, each tagged with its source topic)
 *   7. Offene Punkte (follow-ups)
 *   8. KI-Assistent (a tool — below the protocol, not above it)
 *   9. Erneut verarbeiten / Abschliessen / Löschen
 */

import { useState, useMemo } from 'react'
import { Loader2, CheckCircle2, FileText, Trash2, AlertCircle, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/select'
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
import { getProtocolReviewChecklist, getProtocolReviewCounts } from '@/lib/protocols/review'
import { pluralDe } from '@/lib/i18n/plural-de'

export default function ProtocolDetailClient(props: ProtocolDetailProps) {
  const router = useRouter()
  const { protocol, actionLinks, teamMembers, protocolDecisions, currentUserId, isProtocolCreator, isSuperAdmin } = props

  const {
    notes,
    isReview,
    isDraft,
    isFinalized,
    error,
    initialProcessingError,
    usesUnifiedPipeline,
    canProcess,
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
    protocolDecisions,
  }), [protocol.status, protocol.raw_transcript, notes, actionLinks, protocolDecisions])

  /**
   * Finalize blockers — enumerate the open prerequisites so the confirm
   * dialog can show specific counts instead of just "kann nicht mehr
   * bearbeitet werden". Per the BB audit: admins were finalizing
   * protocols with open decisions / unconverted task items, then losing
   * the ability to convert them after finalize. Naming the consequence
   * up-front lets them act intentionally rather than by surprise.
   */
  const finalizeBlockers = useMemo(() => {
    const counts = getProtocolReviewCounts(notes, actionLinks, protocolDecisions)
    return {
      unlinkedTasks: counts.unlinkedTasks,
      openDecisions: counts.openDecisions,
      closedDecisionsWithoutTask: counts.closedDecisionsWithoutTask,
      unresolvedAssignees: counts.unresolvedAssignees,
      hasAny: counts.unlinkedTasks > 0 || counts.openDecisions > 0 || counts.closedDecisionsWithoutTask > 0 || counts.unresolvedAssignees > 0,
    }
  }, [notes, actionLinks, protocolDecisions])

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
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
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

      {/* Draft input (no notes yet) — same sources + endpoint as the create page */}
      {isDraft && !notes && (
        <ProtocolDraftInput
          allowAudio={usesUnifiedPipeline}
          transcript={transcript}
          audioFile={audioFile}
          processing={processing}
          canProcess={canProcess}
          onTranscriptChange={setTranscript}
          onAudioFileSelect={handleAudioFileSelect}
          onFileUpload={handleFileUpload}
          onProcess={handleProcess}
        />
      )}

      {/* Main content — only when structured notes exist. Order follows the
          actual pipeline the user reads: overview → source → structured notes
          → derived actions/decisions → follow-ups → tools. */}
      {notes && (
        <>
          {/* 1. Zusammenfassung — executive overview */}
          <div className="bg-surface-base rounded-lg border border-default p-5">
            <h2 className="text-base font-semibold text-text-primary mb-2">
              Zusammenfassung
            </h2>
            <p className="text-text-secondary leading-relaxed">
              {notes.summary}
            </p>
          </div>

          {/* 2. Quelle — Rohtranskript / Notizen. Moved out of the sidebar into
              the main flow so the pipeline reads source → structure → actions.
              Collapsed by default; the structured view below is the daily one. */}
          {protocol.raw_transcript && (
            <details className="bg-surface-base rounded-lg border border-default">
              <summary className="flex items-center gap-2 p-4 cursor-pointer text-sm font-medium text-text-secondary hover:text-text-primary select-none">
                <FileText className="w-4 h-4 text-text-muted" />
                Quelle · Rohtranskript ({protocol.raw_transcript.length.toLocaleString()} Zeichen)
              </summary>
              <div className="px-4 pb-4">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap max-h-96 overflow-y-auto bg-surface-raised rounded-lg p-3 leading-relaxed">
                  {protocol.raw_transcript}
                </pre>
              </div>
            </details>
          )}

          {/* 3. Strukturierte Notizen (Themen) — the transform of the source */}
          <ProtocolTopicsSection
            topics={notes.topics}
            expandedTopics={expandedTopics}
            onToggleTopic={toggleTopic}
          />

          {/* 4. Personen-Zuordnung — optional metadata; sits below the content
              it annotates, not above it. Advisory, not blocking (finalization
              isn't gated on it; task assignment just falls back to manual). */}
          {isReview && notes.detected_attendees && notes.detected_attendees.length > 0 && (
            <div className="rounded-lg border border-default bg-surface-base p-4">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 shrink-0 mt-0.5 text-text-tertiary" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold mb-1 text-text-primary">
                    {allMapped
                      ? 'Alle Personen zugeordnet'
                      : `Erkannte Personen (${unmappedAttendees.length} noch offen)`
                    }
                  </h3>
                  {!allMapped && (
                    <p className="text-xs text-text-tertiary mb-3">
                      Optional. Zuordnung erlaubt automatische Aufgaben­zuweisung; sonst manuell.
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
          )}

          {/* 5. Aktionen & Entscheidungen — derived items, each tagged with the
              source topic it came from (provenance) */}
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
            protocolDecisions={protocolDecisions}
            currentUserId={currentUserId}
            isProtocolCreator={isProtocolCreator}
            onCreateTask={handleCreateTask}
            onCreateAllTasks={handleCreateAllTasks}
            onRefresh={() => router.refresh()}
          />

          {/* 6. Offene Punkte */}
          {notes.follow_ups && notes.follow_ups.length > 0 && (
            <ProtocolFollowUps followUps={notes.follow_ups} />
          )}

          {/* 7. KI-Assistent — a tool for asking about the protocol, not primary
              content, so it sits below the protocol itself. Collapsed by default. */}
          <ProtocolAIChat title={protocol.title} notes={notes} />

          {/* 8. Erneut verarbeiten (edge case — collapsed by default) */}
          {isReview && (
            <ProtocolReprocessSection
              inputMethod={protocol.input_method}
              allowAudio={usesUnifiedPipeline}
              transcript={transcript}
              audioFile={audioFile}
              processing={processing}
              canProcess={canProcess}
              reprocessMinLength={getReprocessMinLength()}
              onTranscriptChange={setTranscript}
              onAudioFileSelect={handleAudioFileSelect}
              onFileUpload={handleFileUpload}
              onProcess={handleProcess}
            />
          )}
        </>
      )}

      {/* Footer actions — outside the notes-only block so a stuck draft
          (e.g. failed processing) can still be deleted instead of lingering
          in the list forever. */}
      {(isReview || isProtocolCreator || isSuperAdmin) && (
        <div className="flex items-center justify-between pt-2">
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

      {/* Empty state */}
      {!notes && !isDraft && protocol.status !== PROTOCOL_STATUSES.PROCESSING && (
        <div className="bg-surface-base rounded-lg border border-default p-12 text-center">
          <FileText className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine strukturierten Notizen
          </Heading>
          <p className="text-text-tertiary">
            Füge ein Transkript hinzu, um es von der KI verarbeiten zu lassen.
          </p>
        </div>
      )}

      <ConfirmDialog
        isOpen={showFinalizeDialog}
        title="Protokoll abschliessen"
        message="Nach dem Abschliessen kann das Protokoll nicht mehr bearbeitet werden."
        details={finalizeBlockers.hasAny ? (
          <div className="rounded-lg border border-warning-300 bg-warning-50 dark:bg-warning-900/20 dark:border-warning-700/50 p-3 text-sm text-warning-800 dark:text-warning-200">
            <p className="font-medium mb-1.5">Offen vor dem Abschluss:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              {finalizeBlockers.unlinkedTasks > 0 && (
                <li>{finalizeBlockers.unlinkedTasks} {pluralDe(finalizeBlockers.unlinkedTasks, 'Aktionspunkt', 'Aktionspunkte')} noch nicht in Aufgaben umgewandelt — nach Abschluss nicht mehr möglich.</li>
              )}
              {finalizeBlockers.openDecisions > 0 && (
                <li>{finalizeBlockers.openDecisions} {pluralDe(finalizeBlockers.openDecisions, 'Entscheidung', 'Entscheidungen')} offen — Abstimmung oder Abschluss fehlt.</li>
              )}
              {finalizeBlockers.closedDecisionsWithoutTask > 0 && (
                <li>{finalizeBlockers.closedDecisionsWithoutTask} {pluralDe(finalizeBlockers.closedDecisionsWithoutTask, 'angenommene Entscheidung', 'angenommene Entscheidungen')} ohne Folgeaufgabe im Aufgaben-System.</li>
              )}
              {finalizeBlockers.unresolvedAssignees > 0 && (
                <li>{finalizeBlockers.unresolvedAssignees} {pluralDe(finalizeBlockers.unresolvedAssignees, 'Personen-Zuordnung', 'Personen-Zuordnungen')} ungeklärt — Aufgaben werden ohne Team-Verknüpfung erstellt.</li>
              )}
            </ul>
          </div>
        ) : undefined}
        confirmLabel={finalizeBlockers.hasAny ? 'Trotzdem abschliessen' : 'Abschliessen'}
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
