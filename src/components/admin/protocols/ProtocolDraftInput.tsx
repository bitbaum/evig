import { Loader2, Wand2, Upload } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

// ExternalAIPanel removed per admin UX audit Z.2 — it pushed staff to
// open ChatGPT/Claude in another tab, then paste structured JSON back.
// The in-app ProtocolAIChat covers the same need without the
// out-of-app round-trip. Net deletion: 182 lines + prop chain across 4
// files. /api/protocols/[id]/process-notes endpoint is preserved
// (still used by the AI structuring button in this same component).

interface Props {
  inputMethod: string
  transcript: string
  audioFile: File | null
  processing: boolean
  onTranscriptChange: (value: string) => void
  onAudioFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onProcess: () => void
}

export function ProtocolDraftInput({
  inputMethod,
  transcript,
  audioFile,
  processing,
  onTranscriptChange,
  onAudioFileSelect,
  onFileUpload,
  onProcess,
}: Props) {
  return (
    <div id="protocol-step-input" className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-white/[0.08] p-6 space-y-4">
      <Heading level={2} className="text-lg text-neutral-900">
        {inputMethod === 'audio' ? 'Audio hochladen' : 'Transkript einfügen'}
      </Heading>
      <p className="text-sm text-neutral-600">
        {inputMethod === 'audio'
          ? 'Lade eine Audiodatei hoch, damit sie transkribiert und strukturiert werden kann.'
          : 'Füge das Transkript ein, um es von der KI strukturieren zu lassen.'}
      </p>

      {inputMethod === 'audio' ? (
        <label className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          Audiodatei wählen
          <input
            type="file"
            accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
            onChange={onAudioFileSelect}
            className="hidden"
          />
        </label>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm text-neutral-600">Transkript</label>
            <label className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 cursor-pointer">
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
            rows={10}
            maxLength={100000}
            placeholder="Transkript hier einfügen..."
            className="font-mono text-sm"
          />
        </>
      )}

      <div className="flex justify-end">
        <Button
          onClick={onProcess}
          disabled={processing || (inputMethod === 'audio' ? !audioFile : transcript.length < 50)}
          variant="primary"
          size="sm"
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
              Schritt 2 starten: KI-Strukturierung
            </>
          )}
        </Button>
      </div>

    </div>
  )
}
