import { useRef } from 'react'
import { Loader2, Save, Wand2, Upload } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { MEETING_TYPE_TEMPLATES } from '@/config/protocols'
import type { MeetingType, InputMethod } from '@/config/protocols'
import { AUDIO_UPLOAD_LIMITS } from '@/lib/protocols/audio-validation'
import { WHISPER_MODELS } from '@/config/transcription'

interface Props {
  inputMethod: InputMethod
  meetingType: MeetingType
  content: string
  loading: boolean
  processing: boolean
  audioFile: File | null
  audioStage: string
  whisperModel: string
  contentFormat: 'json' | 'text' | null
  submitButtonLabel: string
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onWhisperModelChange: (model: string) => void
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCreateAndProcess: () => void
  onCreateWithoutContent: () => void
  onBack: () => void
}

export function ContentInputStep({
  inputMethod,
  meetingType,
  content,
  loading,
  processing,
  audioFile,
  audioStage,
  whisperModel,
  contentFormat,
  submitButtonLabel,
  onContentChange,
  onWhisperModelChange,
  onAudioUpload,
  onFileUpload,
  onCreateAndProcess,
  onCreateWithoutContent,
  onBack,
}: Props) {
  const localFileRef = useRef<HTMLInputElement>(null)

  if (inputMethod === 'audio') {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-5">
        <Heading level={2} className="text-lg text-gray-900">Audio hochladen</Heading>
        <p className="text-sm text-gray-600">
          Lade eine Audiodatei hoch. Die Aufnahme wird automatisch transkribiert und danach in Aufgaben umgewandelt.
        </p>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800 mb-1">Ablauf</p>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-0.5">
            <li>Audio hochladen</li>
            <li>Automatische Transkription</li>
            <li>KI strukturiert Protokoll und Aktionen</li>
            <li>Aufgaben prüfen und mit einem Klick erstellen</li>
          </ol>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="whisper-model" className="block text-sm font-medium text-gray-700 mb-1">
              Whisper-Modell
            </label>
            <select
              id="whisper-model"
              value={whisperModel}
              onChange={(e) => onWhisperModelChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {WHISPER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.size}) — {m.hint}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Audiodatei wählen (.mp3, .m4a, .wav, .ogg, .webm)
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
              onChange={onAudioUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500">Maximale Dateigrösse: {(AUDIO_UPLOAD_LIMITS.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB</p>
          {audioFile && (
            <p className="text-sm text-gray-700">
              Gewählt: <span className="font-medium">{audioFile.name}</span> ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          )}
        </div>

        {processing && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {audioStage === 'uploading' && 'Audio wird hochgeladen...'}
            {audioStage === 'transcribing' && 'Audio wird transkribiert...'}
            {audioStage === 'processing' && 'Transkript wird in Protokoll und Aufgaben umgewandelt...'}
          </div>
        )}

        <SubmitFooter
          loading={loading}
          processing={processing}
          disabled={!audioFile}
          submitLabel="Erstellen & Verarbeiten"
          onSubmit={onCreateAndProcess}
          onBack={onBack}
        />
      </div>
    )
  }

  const config = CONTENT_CONFIG[inputMethod]

  return (
    <div className="bg-white rounded-lg border p-6 space-y-6">
      <Heading level={2} className="text-lg text-gray-900">{config.title}</Heading>
      <p className="text-sm text-gray-600">{config.description}</p>

      {inputMethod === 'transcript' && MEETING_TYPE_TEMPLATES[meetingType].agenda_hints.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-1">Typische Agenda:</p>
          <ul className="text-sm text-blue-700 list-disc list-inside">
            {MEETING_TYPE_TEMPLATES[meetingType].agenda_hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {inputMethod === 'tasks' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-1">Formathinweise:</p>
          <ul className="text-sm text-blue-700 list-disc list-inside space-y-0.5">
            <li>Max: Website aktualisieren (Zuweisung erkannt)</li>
            <li>Dringend: Server-Backup prüfen (Priorität erkannt)</li>
            <li>Dokumentation bis Freitag fertigstellen (Frist erkannt)</li>
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              {config.fieldLabel}
            </label>
            {config.showFormatBadge && contentFormat && (
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                contentFormat === 'json'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {contentFormat === 'json' ? 'JSON erkannt' : 'Freitext erkannt'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => localFileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
          >
            <Upload className="w-3.5 h-3.5" />
            {config.uploadLabel}
          </button>
          <input
            ref={localFileRef}
            type="file"
            accept={config.fileAccept}
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
        <textarea
          id="content"
          name="content"
          value={content}
          onChange={onContentChange}
          rows={config.rows}
          maxLength={config.maxLength}
          placeholder={config.placeholder}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <p className="mt-1 text-sm text-gray-500">
          {content.length > 0
            ? `${content.length.toLocaleString()} Zeichen`
            : config.emptyHint}
        </p>
      </div>

      <SubmitFooter
        loading={loading}
        processing={processing}
        disabled={content.length < config.minLength}
        submitLabel={submitButtonLabel}
        showCreateEmpty
        onSubmit={onCreateAndProcess}
        onCreateEmpty={onCreateWithoutContent}
        onBack={onBack}
      />
    </div>
  )
}

const CONTENT_CONFIG: Record<Exclude<InputMethod, 'audio'>, {
  title: string
  description: string
  fieldLabel: string
  uploadLabel: string
  fileAccept: string
  placeholder: string
  emptyHint: string
  rows: number
  maxLength: number
  minLength: number
  showFormatBadge: boolean
}> = {
  transcript: {
    title: 'Transkript',
    description: 'Füge das Transkript ein oder lade eine .txt-Datei hoch. Du kannst diesen Schritt auch überspringen und das Transkript später hinzufügen.',
    fieldLabel: 'Transkript',
    uploadLabel: '.txt hochladen',
    fileAccept: '.txt,.md,.text',
    placeholder: 'Transkript hier einfügen...',
    emptyHint: 'Optional — kann auch später hinzugefügt werden',
    rows: 12,
    maxLength: 100000,
    minLength: 50,
    showFormatBadge: false,
  },
  notes: {
    title: 'Strukturierte Notizen',
    description: 'Füge deine Notizen ein (Stichpunkte, Abschnitte) oder lade eine JSON-/.txt-Datei hoch. JSON wird direkt übernommen, Freitext wird von der KI strukturiert.',
    fieldLabel: 'Notizen',
    uploadLabel: '.json/.txt hochladen',
    fileAccept: '.txt,.md,.text,.json',
    placeholder: 'Notizen hier einfügen (JSON oder Freitext)...',
    emptyHint: 'JSON für direkten Import oder Freitext für KI-Strukturierung',
    rows: 12,
    maxLength: 100000,
    minLength: 20,
    showFormatBadge: true,
  },
  tasks: {
    title: 'Aufgabenliste',
    description: 'Füge Aufgaben ein — eine pro Zeile. Die KI erkennt Zuweisungen, Prioritäten und Fristen. JSON-Arrays werden direkt importiert.',
    fieldLabel: 'Aufgaben',
    uploadLabel: '.txt hochladen',
    fileAccept: '.txt,.md,.text,.json',
    placeholder: 'Aufgaben hier einfügen — eine pro Zeile...',
    emptyHint: 'Eine Aufgabe pro Zeile oder JSON-Array',
    rows: 10,
    maxLength: 50000,
    minLength: 10,
    showFormatBadge: true,
  },
}

function SubmitFooter({
  loading,
  processing,
  disabled,
  submitLabel,
  showCreateEmpty = false,
  onSubmit,
  onCreateEmpty,
  onBack,
}: {
  loading: boolean
  processing: boolean
  disabled: boolean
  submitLabel: string
  showCreateEmpty?: boolean
  onSubmit: () => void
  onCreateEmpty?: () => void
  onBack: () => void
}) {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t">
      {showCreateEmpty && onCreateEmpty ? (
        <button
          type="button"
          onClick={onCreateEmpty}
          disabled={loading}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
        >
          {loading && !processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Save className="w-4 h-4 inline mr-1" /> Ohne Inhalt erstellen</>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
        >
          Zurück
        </button>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={loading || disabled}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            KI verarbeitet...
          </>
        ) : loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Erstellt...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            {submitLabel}
          </>
        )}
      </button>
    </div>
  )
}
