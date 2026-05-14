import { useRef } from 'react'
import { Loader2, Save, Wand2, Upload } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { FormField } from '@/components/ui/form-field'
import { Button } from '@/components/ui/button'
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
        <Heading level={2} className="text-lg text-neutral-900">Audio hochladen</Heading>
        <p className="text-sm text-neutral-600">
          Lade eine Audiodatei hoch. Die Aufnahme wird automatisch transkribiert und danach in Aufgaben umgewandelt.
        </p>

        <div className="rounded-lg border border-info-200 bg-info-50 p-4">
          <p className="text-sm font-medium text-info-800 mb-1">Ablauf</p>
          <ol className="list-decimal list-inside text-sm text-info-700 space-y-0.5">
            <li>Audio hochladen</li>
            <li>Automatische Transkription</li>
            <li>KI strukturiert Protokoll und Aktionen</li>
            <li>Aufgaben prüfen und mit einem Klick erstellen</li>
          </ol>
        </div>

        <div className="space-y-3">
          <FormField label="Whisper-Modell" htmlFor="whisper-model">
            <Select
              id="whisper-model"
              value={whisperModel}
              onChange={(e) => onWhisperModelChange(e.target.value)}
            >
              {WHISPER_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.size}) — {m.hint}
                </option>
              ))}
            </Select>
          </FormField>

          <label className="flex items-center gap-1.5 text-sm text-info-700 hover:text-info-900 cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            Audiodatei wählen (.mp3, .m4a, .wav, .ogg, .webm)
            <input
              type="file"
              accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
              onChange={onAudioUpload}
              className="hidden"
            />
          </label>
          <p className="text-xs text-neutral-500">Maximale Dateigrösse: {(AUDIO_UPLOAD_LIMITS.maxSizeBytes / (1024 * 1024)).toFixed(0)} MB</p>
          {audioFile && (
            <p className="text-sm text-neutral-700">
              Gewählt: <span className="font-medium">{audioFile.name}</span> ({(audioFile.size / (1024 * 1024)).toFixed(1)} MB)
            </p>
          )}
        </div>

        {processing && (
          <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-800">
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
      <Heading level={2} className="text-lg text-neutral-900">{config.title}</Heading>
      <p className="text-sm text-neutral-600">{config.description}</p>

      {inputMethod === 'transcript' && MEETING_TYPE_TEMPLATES[meetingType].agenda_hints.length > 0 && (
        <div className="bg-info-50 border border-info-200 rounded-lg p-3">
          <p className="text-sm font-medium text-info-800 mb-1">Typische Agenda:</p>
          <ul className="text-sm text-info-700 list-disc list-inside">
            {MEETING_TYPE_TEMPLATES[meetingType].agenda_hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ul>
        </div>
      )}

      {inputMethod === 'tasks' && (
        <div className="bg-info-50 border border-info-200 rounded-lg p-3">
          <p className="text-sm font-medium text-info-800 mb-1">Formathinweise:</p>
          <ul className="text-sm text-info-700 list-disc list-inside space-y-0.5">
            <li>Max: Website aktualisieren (Zuweisung erkannt)</li>
            <li>Dringend: Server-Backup prüfen (Priorität erkannt)</li>
            <li>Dokumentation bis Freitag fertigstellen (Frist erkannt)</li>
          </ul>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <label htmlFor="content" className="block text-sm font-medium text-neutral-700">
              {config.fieldLabel}
            </label>
            {config.showFormatBadge && contentFormat && (
              <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                contentFormat === 'json'
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-info-100 text-info-800'
              }`}>
                {contentFormat === 'json' ? 'JSON erkannt' : 'Freitext erkannt'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => localFileRef.current?.click()}
            className="flex items-center gap-1.5 text-sm text-info-600 hover:text-info-800"
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
        <Textarea
          id="content"
          name="content"
          value={content}
          onChange={onContentChange}
          rows={config.rows}
          maxLength={config.maxLength}
          placeholder={config.placeholder}
          className="font-mono text-sm"
        />
        <p className="mt-1 text-sm text-neutral-500">
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
        <Button
          type="button"
          onClick={onCreateEmpty}
          disabled={loading}
          variant="outline"
          size="sm"
          className="gap-1"
        >
          {loading && !processing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <><Save className="w-4 h-4" /> Ohne Inhalt erstellen</>
          )}
        </Button>
      ) : (
        <Button type="button" onClick={onBack} variant="outline" size="sm">
          Zurück
        </Button>
      )}
      <Button
        type="button"
        onClick={onSubmit}
        disabled={loading || disabled}
        variant="primary"
        size="sm"
        className="gap-2"
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
      </Button>
    </div>
  )
}
