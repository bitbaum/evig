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

import { useEffect, useMemo } from 'react'
import {
  useProtocolDetail,
  ProtocolReprocessSection,
  ProtocolTopicsSection,
  ProtocolActionItemsList,
  ProtocolFollowUps,
  ProtocolAIChat,
} from '@/components/admin/protocols'
import type { ProtocolDetailProps } from '@/components/admin/protocols'
import { PROTOCOL_STATUSES } from '@/config/protocols'
import { useRouter } from 'next/navigation'
import { getProtocolReviewChecklist, getProtocolReviewCounts } from '@/lib/protocols/review'
import { ProtocolPipelineHeader } from './detail/ProtocolPipelineHeader'
import { ProtocolSummaryCard } from './detail/ProtocolSummaryCard'
import { ProtocolAttendeeMapping } from './detail/ProtocolAttendeeMapping'
import { ProtocolDetailFooter } from './detail/ProtocolDetailFooter'

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
    addingCustomTask,
    handleAddCustomTask,
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

  // While the AI runs, refresh until the status flips — the user should never
  // have to reload by hand to see their structured notes appear.
  const isProcessing = protocol.status === PROTOCOL_STATUSES.PROCESSING
  useEffect(() => {
    if (!isProcessing) return
    const timer = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(timer)
  }, [isProcessing, router])

  return (
    <div className="space-y-4">
      {/* Error banner, progress strip, processing state, draft input, source */}
      <ProtocolPipelineHeader
        error={error}
        initialProcessingError={initialProcessingError}
        reviewChecklist={reviewChecklist}
        isProcessing={isProcessing}
        isDraft={isDraft}
        notes={notes}
        protocol={protocol}
        usesUnifiedPipeline={usesUnifiedPipeline}
        transcript={transcript}
        audioFile={audioFile}
        processing={processing}
        canProcess={canProcess}
        setTranscript={setTranscript}
        handleAudioFileSelect={handleAudioFileSelect}
        handleFileUpload={handleFileUpload}
        handleProcess={handleProcess}
      />

      {/* Main content — only when structured notes exist. Order follows the
          actual pipeline the user reads: overview → structured notes →
          derived actions/decisions → follow-ups → tools. */}
      {notes && (
        <>
          {/* 1. Zusammenfassung — executive overview */}
          <ProtocolSummaryCard notes={notes} />

          {/* 2. Strukturierte Notizen (Themen) — the transform of the source */}
          <ProtocolTopicsSection
            topics={notes.topics}
            expandedTopics={expandedTopics}
            onToggleTopic={toggleTopic}
          />

          {/* 4. Personen-Zuordnung — optional metadata; sits below the content
              it annotates, not above it. Advisory, not blocking (finalization
              isn't gated on it; task assignment just falls back to manual). */}
          {isReview && notes.detected_attendees && notes.detected_attendees.length > 0 && (
            <ProtocolAttendeeMapping
              notes={notes}
              teamMembers={teamMembers}
              unmappedAttendees={unmappedAttendees}
              allMapped={allMapped}
              attendeeMapping={attendeeMapping}
              setAttendeeMapping={setAttendeeMapping}
              mappingDirty={mappingDirty}
              setMappingDirty={setMappingDirty}
              savingMapping={savingMapping}
              handleSaveMapping={handleSaveMapping}
            />
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
            teamMembers={teamMembers}
            addingCustomTask={addingCustomTask}
            onCreateTask={handleCreateTask}
            onCreateAllTasks={handleCreateAllTasks}
            onAddCustomTask={handleAddCustomTask}
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
          in the list forever. Also owns the empty state + confirm dialogs. */}
      <ProtocolDetailFooter
        protocol={protocol}
        notes={notes}
        isDraft={isDraft}
        isReview={isReview}
        isProtocolCreator={isProtocolCreator}
        isSuperAdmin={isSuperAdmin}
        finalizeBlockers={finalizeBlockers}
        showFinalizeDialog={showFinalizeDialog}
        setShowFinalizeDialog={setShowFinalizeDialog}
        finalizing={finalizing}
        handleFinalize={handleFinalize}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        deleting={deleting}
        handleDelete={handleDelete}
      />
    </div>
  )
}
