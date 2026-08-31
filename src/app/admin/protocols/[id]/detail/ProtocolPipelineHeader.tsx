'use client';

/** Pipeline-header slice — error banner, progress strip, processing spinner, draft input, and raw-transcript source. */

import type { ComponentProps } from 'react';
import { ProtocolDraftInput, ProtocolProgressStrip } from '@/components/admin/protocols';
import type { ProtocolDetail, StructuredNotes } from '@/lib/schemas/protocols';
import { ProtocolErrorBanner } from './ProtocolErrorBanner';
import { ProtocolProcessingCard } from './ProtocolProcessingCard';
import { ProtocolTranscriptSource } from './ProtocolTranscriptSource';

type DraftInputProps = ComponentProps<typeof ProtocolDraftInput>;

interface ProtocolPipelineHeaderProps {
  error: string | null;
  initialProcessingError?: { message: string; retryable: boolean } | null;
  reviewChecklist: ComponentProps<typeof ProtocolProgressStrip>['items'];
  isProcessing: boolean;
  isDraft: boolean;
  notes: StructuredNotes | null;
  protocol: ProtocolDetail;
  usesUnifiedPipeline: boolean;
  transcript: string;
  audioFile: File | null;
  processing: boolean;
  canProcess: boolean;
  setTranscript: DraftInputProps['onTranscriptChange'];
  handleAudioFileSelect: DraftInputProps['onAudioFileSelect'];
  handleFileUpload: DraftInputProps['onFileUpload'];
  handleProcess: DraftInputProps['onProcess'];
}

export function ProtocolPipelineHeader({
  error,
  initialProcessingError,
  reviewChecklist,
  isProcessing,
  isDraft,
  notes,
  protocol,
  usesUnifiedPipeline,
  transcript,
  audioFile,
  processing,
  canProcess,
  setTranscript,
  handleAudioFileSelect,
  handleFileUpload,
  handleProcess,
}: ProtocolPipelineHeaderProps) {
  return (
    <>
      {/* Error Banner */}
      {error && (
        <ProtocolErrorBanner error={error} initialProcessingError={initialProcessingError} />
      )}

      {/* Progress Strip — the whole pipeline (Input → Struktur → Personen →
          Entscheide → Aufgaben → Abschluss), visible in EVERY state so the
          user always knows where the protocol stands and what comes next. */}
      <ProtocolProgressStrip items={reviewChecklist} />

      {/* Processing Spinner */}
      {isProcessing && <ProtocolProcessingCard />}

      {/* Draft input (no notes yet) — same sources + endpoint as the create page */}
      {isDraft && !notes && (
        <ProtocolDraftInput
          allowAudio={usesUnifiedPipeline}
          hasTranscript={Boolean(protocol.raw_transcript)}
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

      {/* Quelle — Rohtranskript. Rendered whenever a transcript exists (also
          without structured notes: while processing runs or after a failed
          structuring the source must stay visible). Collapsed when the
          structured view exists; expanded when it is the only content. */}
      {protocol.raw_transcript && !(isDraft && !notes) && (
        <ProtocolTranscriptSource protocol={protocol} notes={notes} />
      )}
    </>
  );
}
