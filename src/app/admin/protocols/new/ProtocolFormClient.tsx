'use client'

/**
 * Protocol Form Client Component — Simplified 2-Step Form
 *
 * Step 1: Setup (type, title, date, visibility, attendees)
 * Step 2: Content (unified text/audio input with auto-detection)
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Mic, FileText, Users, ChevronDown, ChevronUp, Check } from 'lucide-react'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_TEMPLATES,
  PROTOCOL_VISIBILITY_LABELS,
} from '@/config/protocols'
import type { MeetingType, ProtocolVisibility } from '@/config/protocols'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import { DEFAULT_WHISPER_MODEL, WHISPER_MODELS } from '@/config/transcription'
import { formatDateShort } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { AIFormAssist } from '@/components/ai/AIFormAssist'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'

interface ProtocolFormClientProps {
  teamMembers: Array<{ id: string; name: string }>
}

export default function ProtocolFormClient({ teamMembers }: ProtocolFormClientProps) {
  const router = useRouter()

  // Form state
  const [meetingType, setMeetingType] = useState<MeetingType | ''>('')
  const [title, setTitle] = useState('')
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0])
  const [visibility, setVisibility] = useState<ProtocolVisibility>('team')
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [showAttendees, setShowAttendees] = useState(true)
  const [attendeeSearch, setAttendeeSearch] = useState('')

  // Content state
  const [content, setContent] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [whisperModel, setWhisperModel] = useState(DEFAULT_WHISPER_MODEL)

  // UI state
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAIFieldsFilled = (data: Partial<Record<string, unknown>>, _metadata: Record<string, AIFieldMetadataEntry>) => {
    if (data.title) setTitle(String(data.title))
    if (data.meeting_type && typeof data.meeting_type === 'string') {
      setMeetingType(data.meeting_type as MeetingType)
    }
    if (data.meeting_date && typeof data.meeting_date === 'string') {
      setMeetingDate(data.meeting_date)
    }
    if (data.visibility && typeof data.visibility === 'string') {
      setVisibility(data.visibility as ProtocolVisibility)
    }
  }

  // Step 1 complete when type + title + date filled
  const setupComplete = meetingType !== '' && title.trim() !== '' && meetingDate !== ''

  // Auto-detect content format
  const contentFormat = useMemo(() => {
    if (!content.trim()) return null
    try { JSON.parse(content); return 'json' as const } catch { return 'text' as const }
  }, [content])

  // Determine input method from content
  const detectedInputMethod = useMemo(() => {
    if (audioFile) return 'audio'
    if (contentFormat === 'json') return 'notes'
    return 'transcript'
  }, [audioFile, contentFormat])

  // Can submit when setup is done and has content
  const hasContent = audioFile !== null || content.trim().length >= 20
  const canSubmit = setupComplete && hasContent && !loading && !processing

  // Auto-generate title when meeting type changes
  useEffect(() => {
    if (meetingType) {
      const template = MEETING_TYPE_TEMPLATES[meetingType]
      setVisibility(template.default_visibility)
      if (!title) {
        setTitle(`${MEETING_TYPE_LABELS[meetingType]} — ${formatDateShort(meetingDate)}`)
      }
    }
  }, [meetingType, meetingDate, title])

  const filteredTeamMembers = useMemo(() => {
    if (!attendeeSearch.trim()) return teamMembers
    const search = attendeeSearch.toLowerCase()
    return teamMembers.filter(m => m.name.toLowerCase().includes(search))
  }, [teamMembers, attendeeSearch])

  const toggleAttendee = (id: string) => {
    setSelectedAttendees(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  const selectAllAttendees = () => {
    if (selectedAttendees.length === teamMembers.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(teamMembers.map(m => m.id))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    // Audio file
    if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|m4a|webm|ogg|flac)$/i)) {
      const validationError = validateAudioUpload(file)
      if (validationError) { setError(validationError); return }
      setAudioFile(file)
      setContent('')
      return
    }

    // Text file
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setContent(text)
        setAudioFile(null)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async () => {
    if (!canSubmit || !meetingType) return
    setLoading(true)
    setError(null)

    try {
      // 1. Create protocol
      const createResult = await apiFetch<{ id: string }>('/api/protocols', {
        method: 'POST',
        body: {
          title,
          meeting_date: meetingDate,
          meeting_type: meetingType,
          visibility,
          input_method: detectedInputMethod,
          attendees: selectedAttendees,
        },
      })
      if (!createResult.success || !createResult.data) {
        throw new Error(createResult.error || 'Fehler beim Erstellen')
      }

      const protocolId = createResult.data.id

      // 2. Process content
      setProcessing(true)

      if (audioFile) {
        const audioFormData = new FormData()
        audioFormData.append('audio', audioFile)
        audioFormData.append('model', whisperModel)

        const processRes = await fetch(`/api/protocols/${protocolId}/process-audio`, {
          method: 'POST',
          body: audioFormData,
        })
        const processData = await processRes.json()
        if (!processData.success) {
          const params = new URLSearchParams({ processing: 'failed', retryable: String(processData.retryable ?? true) })
          if (processData.error) params.set('error', String(processData.error).slice(0, 250))
          router.push(`/admin/protocols/${protocolId}?${params}`)
          return
        }
      } else if (content.trim()) {
        const endpoint = detectedInputMethod === 'notes' ? 'process-notes' : 'process'
        const body = detectedInputMethod === 'transcript'
          ? { raw_transcript: content }
          : { content }

        const processRes = await fetch(`/api/protocols/${protocolId}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const processData = await processRes.json()
        if (!processData.success) {
          const params = new URLSearchParams({ processing: 'failed', retryable: String(processData.retryable ?? true) })
          if (processData.error) params.set('error', String(processData.error).slice(0, 250))
          router.push(`/admin/protocols/${protocolId}?${params}`)
          return
        }
      }

      router.push(`/admin/protocols/${protocolId}`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* AI pre-fill for setup fields (text-based only, Whisper audio is separate) */}
      <AIFormAssist
        formType="protocol"
        variant="bar"
        defaultExpanded={true}
        placeholder="z.B. Vorstandssitzung März 2026 mit Andreas und Maria..."
        currentData={{ title, meeting_type: meetingType, meeting_date: meetingDate, visibility }}
        onFieldsFilled={handleAIFieldsFilled}
      />

      {error && (
        <div className="p-4 bg-error-50 border border-error-200 rounded-lg text-error-700">{error}</div>
      )}

      {/* Step 1: Setup */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <Heading level={2} className="text-lg font-semibold text-neutral-900">Sitzungsdetails</Heading>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Meeting Type */}
          <div>
            <label htmlFor="meeting_type" className="block text-sm font-medium text-neutral-700 mb-1">
              Sitzungstyp
            </label>
            <select
              id="meeting_type"
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value as MeetingType)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Typ wählen...</option>
              {Object.entries(MEETING_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="meeting_date" className="block text-sm font-medium text-neutral-700 mb-1">
              Datum
            </label>
            <input
              id="meeting_date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-neutral-700 mb-1">
            Titel
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Teamsitzung — 2. April 2026"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-neutral-700 mb-1">
              Sichtbarkeit
            </label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as ProtocolVisibility)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(PROTOCOL_VISIBILITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Attendees */}
        <div>
          <button
            type="button"
            onClick={() => setShowAttendees(!showAttendees)}
            className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            <Users className="w-4 h-4" />
            Teilnehmer ({selectedAttendees.length}/{teamMembers.length})
            {showAttendees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAttendees && (
            <div className="mt-2 p-3 bg-neutral-50 rounded-lg border space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="Teilnehmer suchen..."
                  className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={selectAllAttendees}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap"
                >
                  {selectedAttendees.length === teamMembers.length ? 'Keine auswählen' : 'Alle auswählen'}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                {filteredTeamMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-100 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAttendees.includes(member.id)}
                      onChange={() => toggleAttendee(member.id)}
                      className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    {member.name}
                  </label>
                ))}
                {filteredTeamMembers.length === 0 && (
                  <p className="text-sm text-neutral-500 px-2 py-1">Keine Teilnehmer gefunden</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Content */}
      {setupComplete && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <Heading level={2} className="text-lg font-semibold text-neutral-900">Inhalt</Heading>
          <p className="text-sm text-neutral-600">
            Transkript, Notizen einfügen oder Audio-Datei hochladen. Die KI strukturiert den Inhalt automatisch.
          </p>

          {/* Textarea */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-neutral-700 mb-1">
              Transkript oder Notizen
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => { setContent(e.target.value); setAudioFile(null) }}
              placeholder="Sitzungsnotizen hier einfügen..."
              rows={10}
              disabled={!!audioFile}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100 disabled:text-neutral-500 font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2">
                {contentFormat && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${contentFormat === 'json' ? 'bg-purple-100 text-purple-700' : 'bg-neutral-100 text-neutral-600'}`}>
                    {contentFormat === 'json' ? 'JSON erkannt' : 'Freitext'}
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500">{content.length} Zeichen</span>
            </div>
          </div>

          {/* File Upload */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Oder Datei hochladen
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 cursor-pointer transition-colors text-sm">
                <Upload className="w-4 h-4" />
                Datei wählen
                <input
                  type="file"
                  accept=".txt,.md,.json,.mp3,.wav,.m4a,.webm,.ogg,.flac"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-neutral-500">.txt, .json, .mp3, .wav, .m4a, .webm</span>
            </div>

            {/* Audio file selected */}
            {audioFile && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{audioFile.name}</span>
                    <span className="text-xs text-blue-600">({(audioFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <button
                    onClick={() => setAudioFile(null)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Entfernen
                  </button>
                </div>

                <div className="mt-2">
                  <label htmlFor="whisper_model" className="block text-xs font-medium text-blue-700 mb-1">
                    Whisper-Modell
                  </label>
                  <select
                    id="whisper_model"
                    value={whisperModel}
                    onChange={(e) => setWhisperModel(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    {WHISPER_MODELS.map((model) => (
                      <option key={model.id} value={model.id}>{model.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-neutral-500">
              {audioFile ? (
                <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Audio wird transkribiert und strukturiert</span>
              ) : content.trim() ? (
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> Text wird von KI strukturiert</span>
              ) : (
                <span>Inhalt eingeben oder Datei hochladen</span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {(loading || processing) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {processing ? 'KI verarbeitet...' : 'Erstellt...'}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Protokoll erstellen
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
