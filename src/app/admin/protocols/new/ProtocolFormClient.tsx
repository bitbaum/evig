'use client'

/**
 * Protocol Form Client Component
 *
 * Single-page progressive form with stepper:
 * 1. Select meeting type (grid of cards with icons)
 * 2. Fill details (title, date, visibility)
 * 3. Select input method (audio, transcript, notes, tasks)
 * 4. Enter content (adapts to selected method)
 *
 * Completed sections collapse to a summary with "Ändern" button.
 * Created: 2026-02-10
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Stepper } from '@/components/ui/Stepper'
import {
  MEETING_TYPES,
  MEETING_TYPE_LABELS,
  MEETING_TYPE_COLORS,
  MEETING_TYPE_ICON_COMPONENTS,
  MEETING_TYPE_TEMPLATES,
  PROTOCOL_VISIBILITY_LABELS,
  INPUT_METHODS,
  INPUT_METHOD_LABELS,
  INPUT_METHOD_DESCRIPTIONS,
  INPUT_METHOD_ICON_COMPONENTS,
} from '@/config/protocols'
import type { MeetingType, ProtocolVisibility, InputMethod } from '@/config/protocols'
import { getErrorMessage } from '@/lib/utils/error'
import {
  Loader2,
  Save,
  Wand2,
  Upload,
} from 'lucide-react'
import { validateAudioUpload, AUDIO_UPLOAD_LIMITS } from '@/lib/protocols/audio-validation'

const STEPS = [
  { label: 'Typ' },
  { label: 'Details' },
  { label: 'Eingabe' },
  { label: 'Inhalt' },
]

interface FormData {
  title: string
  meeting_date: string
  meeting_type: MeetingType | ''
  visibility: ProtocolVisibility
  input_method: InputMethod | ''
  content: string
}

export default function ProtocolFormClient() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [audioStage, setAudioStage] = useState<'idle' | 'uploading' | 'transcribing' | 'processing'>('idle')
  const [formData, setFormData] = useState<FormData>({
    title: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_type: '',
    visibility: 'team',
    input_method: '',
    content: '',
  })

  // Compute current step from form state
  const hasType = formData.meeting_type !== ''
  const hasDetails = hasType && formData.title.trim() !== '' && formData.meeting_date !== ''
  const hasInputMethod = hasDetails && formData.input_method !== ''
  const currentStep = !hasType ? 0 : !hasDetails ? 1 : !hasInputMethod ? 2 : 3

  // Auto-detect JSON in content
  const contentFormat = useMemo(() => {
    if (!formData.content.trim()) return null
    try {
      JSON.parse(formData.content)
      return 'json' as const
    } catch {
      return 'text' as const
    }
  }, [formData.content])

  // Update defaults when meeting type changes
  useEffect(() => {
    const mt = formData.meeting_type
    if (mt) {
      const template = MEETING_TYPE_TEMPLATES[mt]
      setFormData(prev => ({
        ...prev,
        visibility: template.default_visibility,
        title: prev.title || `${MEETING_TYPE_LABELS[mt]} — ${new Date(prev.meeting_date).toLocaleDateString('de-CH')}`,
      }))
    }
  }, [formData.meeting_type])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const selectMeetingType = (type: MeetingType) => {
    setFormData(prev => ({ ...prev, meeting_type: type }))
  }

  const selectInputMethod = (method: InputMethod) => {
    setFormData(prev => ({ ...prev, input_method: method, content: '' }))
    setAudioFile(null)
    setAudioStage('idle')
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validationError = validateAudioUpload(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setAudioFile(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setFormData(prev => ({ ...prev, content: text }))
      }
    }
    reader.readAsText(file)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getProcessEndpoint = () => {
    switch (formData.input_method) {
      case 'notes': return 'process-notes'
      case 'tasks': return 'import-tasks'
      default: return 'process'
    }
  }

  const getProcessBody = () => {
    if (formData.input_method === 'transcript') {
      return { raw_transcript: formData.content }
    }
    return { content: formData.content }
  }

  const getMinContentLength = () => {
    switch (formData.input_method) {
      case 'tasks': return 10
      case 'notes': return 20
      default: return 50
    }
  }

  const handleCreateAndProcess = async () => {
    if (!formData.meeting_type || !formData.title) return

    setLoading(true)
    setError(null)

    try {
      // 1. Create protocol
      const createRes = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          meeting_date: formData.meeting_date,
          meeting_type: formData.meeting_type,
          visibility: formData.visibility,
          input_method: formData.input_method || 'transcript',
          attendees: [],
        }),
      })

      const createData = await createRes.json()
      if (!createData.success) {
        throw new Error(createData.error || 'Fehler beim Erstellen')
      }

      const protocolId = createData.data.id

      // 2. If content provided and meets minimum, process it
      const minLen = getMinContentLength()
      if (formData.input_method === 'audio' && audioFile) {
        setProcessing(true)
        setAudioStage('uploading')

        const audioFormData = new FormData()
        audioFormData.append('audio', audioFile)

        setAudioStage('transcribing')
        const processAudioRes = await fetch(`/api/protocols/${protocolId}/process-audio`, {
          method: 'POST',
          body: audioFormData,
        })

        const processAudioData = await processAudioRes.json()
        if (!processAudioData.success) {
          const params = new URLSearchParams()
          params.set('processing', 'failed')
          params.set('retryable', String(processAudioData.retryable ?? true))
          if (processAudioData.error) {
            params.set('error', String(processAudioData.error).slice(0, 250))
          }
          router.push(`/admin/protocols/${protocolId}?${params.toString()}`)
          return
        }
      } else if (formData.content.trim().length >= minLen && formData.input_method && formData.input_method !== 'audio') {
        setProcessing(true)

        const endpoint = getProcessEndpoint()
        const processRes = await fetch(`/api/protocols/${protocolId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(getProcessBody()),
        })

        const processData = await processRes.json()
        if (!processData.success) {
          // Protocol was created, but processing failed — redirect with explicit feedback
          const params = new URLSearchParams()
          params.set('processing', 'failed')
          params.set('retryable', String(processData.retryable ?? true))
          if (processData.error) {
            params.set('error', String(processData.error).slice(0, 250))
          }
          router.push(`/admin/protocols/${protocolId}?${params.toString()}`)
          return
        }
      }

      router.push(`/admin/protocols/${protocolId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
      setProcessing(false)
      setAudioStage('idle')
    }
  }

  const handleStepClick = (step: number) => {
    if (step === 0 && hasType) {
      setFormData(prev => ({ ...prev, meeting_type: '', title: '', input_method: '', content: '' }))
    } else if (step === 1 && hasDetails) {
      setFormData(prev => ({ ...prev, title: '', meeting_date: prev.meeting_date }))
    } else if (step === 2 && hasInputMethod) {
      setFormData(prev => ({ ...prev, input_method: '', content: '' }))
    }
  }

  const getSubmitButtonLabel = () => {
    if (formData.input_method === 'tasks') return 'Erstellen & Importieren'
    return 'Erstellen & Verarbeiten'
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Stepper steps={STEPS} currentStep={currentStep} onStepClick={handleStepClick} />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Step 1: Meeting Type */}
      {!hasType ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Besprechungstyp wählen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(MEETING_TYPES).map((type) => {
              const template = MEETING_TYPE_TEMPLATES[type]
              const IconComponent = MEETING_TYPE_ICON_COMPONENTS[type]
              return (
                <button
                  key={type}
                  onClick={() => selectMeetingType(type)}
                  className="text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {IconComponent && (
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${MEETING_TYPE_COLORS[type].replace('text-', 'text-').split(' ')[0]}`}>
                          <IconComponent className={`w-4 h-4 ${MEETING_TYPE_COLORS[type].split(' ')[1]}`} />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">
                        {MEETING_TYPE_LABELS[type]}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{template.typical_duration}</span>
                  </div>
                  {template.agenda_hints.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {template.agenda_hints.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {(() => {
              const IconComponent = MEETING_TYPE_ICON_COMPONENTS[formData.meeting_type as MeetingType]
              return IconComponent ? <IconComponent className="w-4 h-4 text-gray-500" /> : null
            })()}
            <span className="font-medium">
              {MEETING_TYPE_LABELS[formData.meeting_type as MeetingType]}
            </span>
            <span className="text-gray-400">·</span>
            <span>{MEETING_TYPE_TEMPLATES[formData.meeting_type as MeetingType].typical_duration}</span>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, meeting_type: '', title: '', input_method: '', content: '' }))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ändern
          </button>
        </div>
      )}

      {/* Step 2: Details */}
      {hasType && !hasDetails && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Details</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="z.B. Teamsitzung 10. Februar 2026"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="meeting_date" className="block text-sm font-medium text-gray-700 mb-1">
              Datum <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="meeting_date"
              name="meeting_date"
              value={formData.meeting_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Sichtbarkeit
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(PROTOCOL_VISIBILITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {hasType && hasDetails && !hasInputMethod && (
        <div className="bg-gray-50 rounded-lg border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">{formData.title}</span>
            <span className="text-gray-400">·</span>
            <span>{new Date(formData.meeting_date).toLocaleDateString('de-CH')}</span>
            <span className="text-gray-400">·</span>
            <span>{PROTOCOL_VISIBILITY_LABELS[formData.visibility]}</span>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ändern
          </button>
        </div>
      )}

      {hasDetails && hasInputMethod && (
        <div className="bg-gray-50 rounded-lg border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="font-medium">{formData.title}</span>
            <span className="text-gray-400">·</span>
            <span>{new Date(formData.meeting_date).toLocaleDateString('de-CH')}</span>
            <span className="text-gray-400">·</span>
            <span>{PROTOCOL_VISIBILITY_LABELS[formData.visibility]}</span>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, title: '' }))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ändern
          </button>
        </div>
      )}

      {/* Step 3: Input Method Selection */}
      {hasDetails && !hasInputMethod && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Eingabemethode wählen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.values(INPUT_METHODS).map((method) => {
              const IconComponent = INPUT_METHOD_ICON_COMPONENTS[method]
              const isDisabled = false

              return (
                <button
                  key={method}
                  onClick={() => !isDisabled && selectInputMethod(method)}
                  disabled={isDisabled}
                  className={`text-left p-4 bg-white border-2 rounded-lg transition-all ${
                    isDisabled
                      ? 'border-gray-100 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {INPUT_METHOD_LABELS[method]}
                        </span>
                        {isDisabled && (
                          <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            Demnächst
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {INPUT_METHOD_DESCRIPTIONS[method]}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {hasInputMethod && (
        <div className="bg-gray-50 rounded-lg border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {(() => {
              const IconComponent = INPUT_METHOD_ICON_COMPONENTS[formData.input_method as InputMethod]
              return IconComponent ? <IconComponent className="w-4 h-4 text-gray-500" /> : null
            })()}
            <span className="font-medium">
              {INPUT_METHOD_LABELS[formData.input_method as InputMethod]}
            </span>
          </div>
          <button
            onClick={() => setFormData(prev => ({ ...prev, input_method: '', content: '' }))}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Ändern
          </button>
        </div>
      )}

      {/* Step 4: Content (adapts to input method) */}
      {hasInputMethod && formData.input_method === 'audio' && (
        <div className="bg-white rounded-lg border p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Audio hochladen</h2>
          <p className="text-sm text-gray-600">
            Laden Sie eine Audiodatei hoch. Die Aufnahme wird automatisch transkribiert und danach in Aufgaben umgewandelt.
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

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Audiodatei wählen (.mp3, .m4a, .wav, .ogg, .webm)
              <input
                type="file"
                accept="audio/*,.mp3,.m4a,.wav,.ogg,.webm"
                onChange={handleAudioUpload}
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

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, input_method: '', content: '' }))
                setAudioFile(null)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              Zurück
            </button>
            <button
              type="button"
              onClick={() => {
                setAudioStage('processing')
                handleCreateAndProcess()
              }}
              disabled={loading || !formData.title || !audioFile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Wird verarbeitet...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Erstellen & Verarbeiten
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {hasInputMethod && formData.input_method === 'transcript' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Transkript</h2>

          <p className="text-sm text-gray-600">
            Fügen Sie das Transkript ein oder laden Sie eine .txt-Datei hoch.
            Sie können diesen Schritt auch überspringen und das Transkript später hinzufügen.
          </p>

          {formData.meeting_type && MEETING_TYPE_TEMPLATES[formData.meeting_type as MeetingType].agenda_hints.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm font-medium text-blue-800 mb-1">Typische Agenda:</p>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                {MEETING_TYPE_TEMPLATES[formData.meeting_type as MeetingType].agenda_hints.map((hint, i) => (
                  <li key={i}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                Transkript
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <Upload className="w-3.5 h-3.5" />
                .txt hochladen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={12}
              maxLength={100000}
              placeholder="Transkript hier einfügen..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.content.length > 0
                ? `${formData.content.length.toLocaleString()} Zeichen`
                : 'Optional — kann auch später hinzugefügt werden'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, content: '' }))
                handleCreateAndProcess()
              }}
              disabled={loading || !formData.title}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              {loading && !processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4 inline mr-1" /> Ohne Inhalt erstellen</>
              )}
            </button>
            <button
              type="button"
              onClick={handleCreateAndProcess}
              disabled={loading || !formData.title || formData.content.length < 50}
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
                  Erstellen & Verarbeiten
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {hasInputMethod && formData.input_method === 'notes' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Strukturierte Notizen</h2>

          <p className="text-sm text-gray-600">
            Fügen Sie Ihre Notizen ein (Stichpunkte, Abschnitte) oder laden Sie eine JSON-/.txt-Datei hoch.
            JSON wird direkt übernommen, Freitext wird von der KI strukturiert.
          </p>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Notizen
                </label>
                {contentFormat && (
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
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <Upload className="w-3.5 h-3.5" />
                .json/.txt hochladen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={12}
              maxLength={100000}
              placeholder="Notizen hier einfügen (JSON oder Freitext)..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.content.length > 0
                ? `${formData.content.length.toLocaleString()} Zeichen`
                : 'JSON für direkten Import oder Freitext für KI-Strukturierung'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, content: '' }))
                handleCreateAndProcess()
              }}
              disabled={loading || !formData.title}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              {loading && !processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4 inline mr-1" /> Ohne Inhalt erstellen</>
              )}
            </button>
            <button
              type="button"
              onClick={handleCreateAndProcess}
              disabled={loading || !formData.title || formData.content.length < 20}
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
                  {getSubmitButtonLabel()}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {hasInputMethod && formData.input_method === 'tasks' && (
        <div className="bg-white rounded-lg border p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Aufgabenliste</h2>

          <p className="text-sm text-gray-600">
            Fügen Sie Aufgaben ein — eine pro Zeile. Die KI erkennt Zuweisungen, Prioritäten und Fristen.
            JSON-Arrays werden direkt importiert.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800 mb-1">Formathinweise:</p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-0.5">
              <li>Max: Website aktualisieren (Zuweisung erkannt)</li>
              <li>Dringend: Server-Backup prüfen (Priorität erkannt)</li>
              <li>Dokumentation bis Freitag fertigstellen (Frist erkannt)</li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                  Aufgaben
                </label>
                {contentFormat && (
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
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
              >
                <Upload className="w-3.5 h-3.5" />
                .txt hochladen
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows={10}
              maxLength={50000}
              placeholder="Aufgaben hier einfügen — eine pro Zeile..."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.content.length > 0
                ? `${formData.content.length.toLocaleString()} Zeichen`
                : 'Eine Aufgabe pro Zeile oder JSON-Array'}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, content: '' }))
                handleCreateAndProcess()
              }}
              disabled={loading || !formData.title}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg"
            >
              {loading && !processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Save className="w-4 h-4 inline mr-1" /> Ohne Inhalt erstellen</>
              )}
            </button>
            <button
              type="button"
              onClick={handleCreateAndProcess}
              disabled={loading || !formData.title || formData.content.length < 10}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importiert...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Erstellt...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  {getSubmitButtonLabel()}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
