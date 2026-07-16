import { Loader2, Wand2, Upload, Mic } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

/**
 * ProtocolReprocessSection — collapsed "not happy with the AI result?" retry
 * on review-state protocols. Uses the same unified pipeline as the create
 * page: audio and/or text (via useProtocolDetail.handleProcess).
 */
interface Props {
  inputMethod: string
  allowAudio: boolean
  transcript: string
  audioFile: File | null
  processing: boolean
  canProcess: boolean
  reprocessMinLength: number
  onTranscriptChange: (value: string) => void
  onAudioFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onProcess: () => void
}

export function ProtocolReprocessSection({
  inputMethod,
  allowAudio,
  transcript,
  audioFile,
  processing,
  canProcess,
  reprocessMinLength,
  onTranscriptChange,
  onAudioFileSelect,
  onFileUpload,
  onProcess,
}: Props) {
  const summaryLabel = inputMethod === 'tasks'
    ? 'Aufgaben erneut importieren'
    : 'Inhalt erneut verarbeiten'

  return (
    <details id="protocol-step-input" className="bg-warning-50 dark:bg-warning-900/20 rounded-lg border border-warning-200 dark:border-warning-700/50">
      <summary className="p-4 cursor-pointer text-sm font-medium text-warning-800 dark:text-warning-200 hover:text-warning-900 dark:hover:text-warning-100">
        Nicht zufrieden? {summaryLabel}
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {allowAudio && (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-sm text-warning-700 hover:text-warning-900 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Neue Audiodatei hochladen
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                onChange={onAudioFileSelect}
                className="hidden"
              />
            </label>
            {audioFile && (
              <span className="inline-flex items-center gap-1.5 text-xs text-warning-700">
                <Mic className="w-3 h-3" />
                {audioFile.name} · {(audioFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-sm text-warning-700">Überarbeiteter Inhalt</label>
          <label className="flex items-center gap-1.5 text-sm text-warning-700 hover:text-warning-900 cursor-pointer">
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
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          rows={6}
          placeholder={inputMethod === 'tasks'
            ? 'Überarbeitete Aufgabenliste einfügen...'
            : 'Überarbeitetes Transkript oder Notizen einfügen...'}
          className="font-mono text-sm"
        />
        <p className="text-xs text-warning-700">
          {transcript.length.toLocaleString()} Zeichen • mindestens {reprocessMinLength} Zeichen{allowAudio ? ' (oder Audio hochladen)' : ''}
        </p>
        <Button
          variant="warning"
          onClick={onProcess}
          disabled={processing || !canProcess}
          className="flex items-center gap-2 px-4 py-2 text-sm text-warning-800 dark:text-warning-200 border border-warning-300 rounded-lg hover:bg-warning-100 dark:hover:bg-warning-900/30 bg-transparent"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Erneut verarbeiten
        </Button>
      </div>
    </details>
  )
}
