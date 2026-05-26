'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_TEMPLATES,
} from '@/config/protocols'
import type { MeetingType, ProtocolVisibility } from '@/config/protocols'
import { apiFetch } from '@/lib/api/client'
import { getErrorMessage } from '@/lib/utils/error'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import { DEFAULT_WHISPER_MODEL } from '@/config/transcription'
import { formatDateShort } from '@/lib/date-formats'
import { todayLocalIso } from '@/lib/utils/date'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'

export function useProtocolForm(
  teamMembers: Array<{ id: string; name: string }>
) {
  const router = useRouter()

  // Form state
  const [meetingType, setMeetingType] = useState<MeetingType | ''>('')
  const [title, setTitle] = useState('')
  // Default meeting date — populated client-side post-mount so the value
  // reflects the user's local-tz today, not the server's UTC today.
  // Without the deferral, a Zurich user logging a protocol between
  // 00:00–02:00 local would see yesterday's UTC date pre-filled and
  // either have to manually correct it or post a protocol dated to the
  // wrong day. Empty initial value triggers the input's "no date" UI
  // for the brief window between SSR and useEffect — protocol author is
  // an admin who immediately interacts with the form, so the gap is
  // imperceptible.
  const [meetingDate, setMeetingDate] = useState<string>('')
  useEffect(() => {
    if (!meetingDate) setMeetingDate(todayLocalIso())
  // Only populate on initial mount — never overwrite a user-picked date.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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

  // Auto-generate title when meeting type changes
  useEffect(() => {
    if (meetingType) {
      const template = MEETING_TYPE_TEMPLATES[meetingType]
      setVisibility(template.default_visibility)
      if (!title) {
        setTitle(
          `${MEETING_TYPE_LABELS[meetingType]} — ${formatDateShort(meetingDate)}`
        )
      }
    }
  }, [meetingType, meetingDate, title])

  // Derived: auto-detect content format (JSON vs plain text)
  const contentFormat = useMemo(() => {
    if (!content.trim()) return null
    try {
      JSON.parse(content)
      return 'json' as const
    } catch {
      return 'text' as const
    }
  }, [content])

  const detectedInputMethod = useMemo(() => {
    if (audioFile) return 'audio'
    if (contentFormat === 'json') return 'notes'
    return 'transcript'
  }, [audioFile, contentFormat])

  const filteredTeamMembers = useMemo(() => {
    if (!attendeeSearch.trim()) return teamMembers
    const search = attendeeSearch.toLowerCase()
    return teamMembers.filter((m) => m.name.toLowerCase().includes(search))
  }, [teamMembers, attendeeSearch])

  const setupComplete =
    meetingType !== '' && title.trim() !== '' && meetingDate !== ''
  const hasContent = audioFile !== null || content.trim().length >= 20
  const canSubmit = setupComplete && hasContent && !loading && !processing

  // Handlers
  const handleAIFieldsFilled = (
    data: Partial<Record<string, unknown>>,
    _metadata: Record<string, AIFieldMetadataEntry>
  ) => {
    if (data.title) setTitle(String(data.title))
    if (data.meeting_type && typeof data.meeting_type === 'string')
      setMeetingType(data.meeting_type as MeetingType)
    if (data.meeting_date && typeof data.meeting_date === 'string')
      setMeetingDate(data.meeting_date)
    if (data.visibility && typeof data.visibility === 'string')
      setVisibility(data.visibility as ProtocolVisibility)
  }

  const handleContentChange = (text: string) => {
    setContent(text)
    setAudioFile(null)
  }

  const toggleAttendee = (id: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const selectAllAttendees = () => {
    if (selectedAttendees.length === teamMembers.length) {
      setSelectedAttendees([])
    } else {
      setSelectedAttendees(teamMembers.map((m) => m.id))
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (
      file.type.startsWith('audio/') ||
      file.name.match(/\.(mp3|wav|m4a|webm|ogg|flac)$/i)
    ) {
      const validationError = validateAudioUpload(file)
      if (validationError) {
        setError(validationError)
        return
      }
      setAudioFile(file)
      setContent('')
      return
    }

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
      setProcessing(true)

      if (audioFile) {
        const audioFormData = new FormData()
        audioFormData.append('audio', audioFile)
        audioFormData.append('model', whisperModel)

        const processRes = await fetch(
          `/api/protocols/${protocolId}/process-audio`,
          { method: 'POST', body: audioFormData }
        )
        const processData = await processRes.json()
        if (!processData.success) {
          const params = new URLSearchParams({
            processing: 'failed',
            retryable: String(processData.retryable ?? true),
          })
          if (processData.error)
            params.set('error', String(processData.error).slice(0, 250))
          router.push(`/admin/protocols/${protocolId}?${params}`)
          return
        }
      } else if (content.trim()) {
        const endpoint =
          detectedInputMethod === 'notes' ? 'process-notes' : 'process'
        const body =
          detectedInputMethod === 'transcript'
            ? { raw_transcript: content }
            : { content }

        const processRes = await fetch(
          `/api/protocols/${protocolId}/${endpoint}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        )
        const processData = await processRes.json()
        if (!processData.success) {
          const params = new URLSearchParams({
            processing: 'failed',
            retryable: String(processData.retryable ?? true),
          })
          if (processData.error)
            params.set('error', String(processData.error).slice(0, 250))
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

  return {
    // Form state
    meetingType,
    setMeetingType,
    title,
    setTitle,
    meetingDate,
    setMeetingDate,
    visibility,
    setVisibility,
    selectedAttendees,
    showAttendees,
    setShowAttendees,
    attendeeSearch,
    setAttendeeSearch,
    // Content state
    content,
    audioFile,
    setAudioFile,
    whisperModel,
    setWhisperModel,
    // UI state
    loading,
    processing,
    error,
    // Computed
    setupComplete,
    hasContent,
    canSubmit,
    contentFormat,
    detectedInputMethod,
    filteredTeamMembers,
    // Handlers
    handleAIFieldsFilled,
    handleContentChange,
    toggleAttendee,
    selectAllAttendees,
    handleFileUpload,
    handleSubmit,
  }
}
