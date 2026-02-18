import { Loader2, Wand2, Upload } from 'lucide-react'

interface Props {
  inputMethod: string
  transcript: string
  audioFile: File | null
  processing: boolean
  reprocessMinLength: number
  onTranscriptChange: (value: string) => void
  onAudioFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onProcess: () => void
}

export function ProtocolReprocessSection({
  inputMethod,
  transcript,
  audioFile,
  processing,
  reprocessMinLength,
  onTranscriptChange,
  onAudioFileSelect,
  onFileUpload,
  onProcess,
}: Props) {
  const summaryLabel = inputMethod === 'tasks'
    ? 'Aufgaben erneut importieren'
    : inputMethod === 'notes'
    ? 'Notizen erneut verarbeiten'
    : inputMethod === 'audio'
    ? 'Audio erneut transkribieren'
    : 'Transkript erneut verarbeiten'

  return (
    <details id="protocol-step-input" className="bg-amber-50 rounded-lg border border-amber-200">
      <summary className="p-4 cursor-pointer text-sm font-medium text-amber-800 hover:text-amber-900">
        Nicht zufrieden? {summaryLabel}
      </summary>
      <div className="px-4 pb-4 space-y-3">
        {inputMethod === 'audio' ? (
          <>
            <label className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 cursor-pointer">
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
              <p className="text-xs text-amber-700">
                Gewählt: {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <label className="text-sm text-amber-700">Überarbeiteter Inhalt</label>
              <label className="flex items-center gap-1.5 text-sm text-amber-700 hover:text-amber-900 cursor-pointer">
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
            <textarea
              value={transcript}
              onChange={(e) => onTranscriptChange(e.target.value)}
              rows={6}
              placeholder={inputMethod === 'tasks'
                ? 'Überarbeitete Aufgabenliste einfügen...'
                : inputMethod === 'notes'
                ? 'Überarbeitete Notizen einfügen...'
                : 'Überarbeitetes Transkript einfügen...'}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono text-sm"
            />
            <p className="text-xs text-amber-700">
              {transcript.length.toLocaleString()} Zeichen • mindestens {reprocessMinLength} Zeichen
            </p>
          </>
        )}
        <button
          onClick={onProcess}
          disabled={processing || (inputMethod === 'audio' ? !audioFile : transcript.length < reprocessMinLength)}
          className="flex items-center gap-2 px-4 py-2 text-sm text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-100 disabled:opacity-50"
        >
          {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          Erneut verarbeiten
        </button>
      </div>
    </details>
  )
}
