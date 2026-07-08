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
import { formatDateShort } from '@/lib/date-formats'
import { todayLocalIso } from '@/lib/utils/date'
import type { AIFieldMetadataEntry } from '@/hooks/useAIFormAssist'
import type { SourceValue } from '@/components/admin/protocols/SourceUploader'

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

  // Content state (multi-source — YY.1):
  //   content = manually typed text (textarea)
  //   sources.audio = optional single recording
  //   sources.textFiles = uploaded .txt/.md/.json files
  // The textarea is independent of file uploads so the user can add
  // typed notes alongside dropped files without one clobbering the other.
  const [content, setContent] = useState('')
  const [sources, setSources] = useState<SourceValue>({ audio: null, textFiles: [] })

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

  const filteredTeamMembers = useMemo(() => {
    if (!attendeeSearch.trim()) return teamMembers
    const search = attendeeSearch.toLowerCase()
    return teamMembers.filter((m) => m.name.toLowerCase().includes(search))
  }, [teamMembers, attendeeSearch])

  const setupComplete =
    meetingType !== '' && title.trim() !== '' && meetingDate !== ''
  const hasContent =
    sources.audio !== null ||
    sources.textFiles.length > 0 ||
    content.trim().length >= 20
  const canSubmit = setupComplete && hasContent && !loading && !processing

  // Used at protocol-creation time so the detail page knows which
  // primary source drove the structuring (drives the reprocess UI label).
  // Audio wins because Whisper is the most expensive step; if the AI is
  // re-run later it should be re-run on the same audio rather than just
  // re-structuring the same text.
  const detectedInputMethod = useMemo<'audio' | 'notes' | 'transcript'>(() => {
    if (sources.audio) return 'audio'
    if (contentFormat === 'json') return 'notes'
    return 'transcript'
  }, [sources.audio, contentFormat])

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

  // SourceUploader is the SSOT for which files exist — we just forward.
  // Errors from validation come back via the `onError` callback wired
  // in the form component.
  const handleSourcesChange = (next: SourceValue) => {
    setSources(next)
    setError(null)
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

      // Single unified upload — all sources go to /process-sources.
      const formData = new FormData()
      if (sources.audio) {
        formData.append('audio', sources.audio)
      }
      if (content.trim()) formData.append('text', content)
      for (const tf of sources.textFiles) formData.append('textFile', tf)

      // apiFetch isn't FormData-aware in a way that keeps the boundary
      // simple; we use fetch directly and parse the JSON manually.
      const processRes = await fetch(
        `/api/protocols/${protocolId}/process-sources`,
        { method: 'POST', body: formData },
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
    setContent,
    sources,
    setSources: handleSourcesChange,
    // UI state
    loading,
    processing,
    error,
    setError,
    // Computed
    setupComplete,
    hasContent,
    canSubmit,
    contentFormat,
    detectedInputMethod,
    filteredTeamMembers,
    // Handlers
    handleAIFieldsFilled,
    toggleAttendee,
    selectAllAttendees,
    handleSubmit,
  }
}
