import { Loader2, Wand2, Upload, Mic } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

/**
 * ProtocolDraftInput — a draft protocol has no structured notes yet (its
 * processing failed or never ran). One card finishes the job: add audio
 * and/or text, run the AI. Mirrors the create page — same sources, same
 * unified /process-sources endpoint (via useProtocolDetail.handleProcess).
 */
interface Props {
  /** Audio uploads are supported for the unified pipeline only. */
  allowAudio: boolean
  /** A transcript is already stored (e.g. transcription succeeded but structuring failed). */
  hasTranscript?: boolean
  transcript: string
  audioFile: File | null
  processing: boolean
  canProcess: boolean
  onTranscriptChange: (value: string) => void
  onAudioFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onProcess: () => void
}

export function ProtocolDraftInput({
  allowAudio,
  hasTranscript = false,
  transcript,
  audioFile,
  processing,
  canProcess,
  onTranscriptChange,
  onAudioFileSelect,
  onFileUpload,
  onProcess,
}: Props) {
  return (
    <div className="bg-surface-base rounded-lg border border-default p-6 space-y-4">
      <div>
        <Heading level={2} className="text-lg text-text-primary">
          {hasTranscript ? 'Transkript bereit — jetzt strukturieren' : 'Inhalt liefern'}
        </Heading>
        <p className="text-sm text-text-secondary mt-1">
          {hasTranscript
            ? 'Das Transkript ist gespeichert (unten einsehbar und bearbeitbar). Starte die KI-Strukturierung, um Themen, Aufgaben und Entscheidungen zu erhalten.'
            : allowAudio
              ? 'Lade die Aufnahme hoch oder füge Text ein — die KI erstellt daraus das Protokoll.'
              : 'Füge den Inhalt ein — die KI erstellt daraus das Protokoll.'}
        </p>
      </div>

      {allowAudio && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-action hover:opacity-80 cursor-pointer">
            <Upload className="w-4 h-4" />
            Audiodatei wählen
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
              onChange={onAudioFileSelect}
              className="hidden"
            />
          </label>
          {audioFile && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary bg-surface-raised border border-default rounded-full px-2.5 py-1">
              <Mic className="w-3 h-3" />
              {audioFile.name} · {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="draft-transcript" className="text-sm text-text-secondary">
            {allowAudio ? 'Notizen / Transkript (optional bei Audio)' : 'Inhalt'}
          </label>
          <label className="flex items-center gap-1.5 text-sm text-action hover:opacity-80 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            .txt hochladen
            <input
              type="file"
              accept=".txt,.md,.text"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
        </div>
        <Textarea
          id="draft-transcript"
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          rows={8}
          maxLength={100000}
          placeholder="Transkript, Notizen oder Stichpunkte einfügen..."
          className="font-mono text-sm"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onProcess}
          disabled={processing || !canProcess}
          variant="primary"
          className="gap-2"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              KI verarbeitet...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Mit KI strukturieren
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
