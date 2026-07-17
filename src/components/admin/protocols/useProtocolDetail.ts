'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/utils/error'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import { PROTOCOL_STATUS } from '@/config/protocol-status'
import { TASK_PRIORITIES } from '@/config/tasks'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import type { StructuredNotes } from '@/lib/schemas/protocols'
import type { ProtocolDetailProps } from './types'

export function useProtocolDetail({ protocol, actionLinks, initialProcessingError = null }: ProtocolDetailProps) {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [creatingTask, setCreatingTask] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialProcessingError?.message || null)
  const [transcript, setTranscript] = useState(protocol.raw_transcript ?? '')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [bulkCreatingTasks, setBulkCreatingTasks] = useState(false)
  const [bulkTaskErrors, setBulkTaskErrors] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const notes = protocol.structured_notes as StructuredNotes | null
  const isReview = protocol.status === PROTOCOL_STATUS.REVIEW
  const isDraft = protocol.status === PROTOCOL_STATUS.DRAFT
  const isFinalized = protocol.status === PROTOCOL_STATUS.FINALIZED

  // Topics are collapsed by default — users expand what they need
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => new Set())

  const [attendeeMapping, setAttendeeMapping] = useState<Record<string, string>>(() => {
    if (!notes?.action_items) return {}
    const mapping: Record<string, string> = {}
    for (const item of notes.action_items) {
      if (item.assigned_to_name && item.assigned_to_id) {
        mapping[item.assigned_to_name] = item.assigned_to_id
      }
    }
    return mapping
  })
  const [mappingDirty, setMappingDirty] = useState(false)

  const linkedActionIds = new Set(actionLinks.map(l => l.action_item_id))
  const unlinkedTaskItems = (notes?.action_items || []).filter(
    item => item.item_type === 'task' && !linkedActionIds.has(item.id)
  )

  const toggleTopic = (id: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSaveMapping = async () => {
    if (!notes || !mappingDirty) return
    setSavingMapping(true)
    setError(null)

    try {
      const updatedNotes = {
        ...notes,
        action_items: notes.action_items.map(item => {
          if (item.assigned_to_name && attendeeMapping[item.assigned_to_name]) {
            return { ...item, assigned_to_id: attendeeMapping[item.assigned_to_name] }
          }
          return item
        }),
      }

      // Mapped people ARE the meeting's attendees — one save keeps both in
      // sync, so nobody has to maintain a second "Teilnehmer" list by hand.
      const mappedIds = Object.values(attendeeMapping).filter(Boolean)
      const attendees = Array.from(new Set([...(protocol.attendees || []), ...mappedIds]))

      const result = await apiFetch<void>(`/api/protocols/${protocol.id}`, {
        method: 'PATCH',
        body: { structured_notes: updatedNotes, attendees },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Speichern')
      setMappingDirty(false)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSavingMapping(false)
    }
  }

  const handleFinalize = async () => {
    setFinalizing(true)
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/protocols/${protocol.id}/finalize`, { method: 'POST' })
      if (!result.success) throw new Error(result.error || 'Fehler beim Abschliessen')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setFinalizing(false)
      setShowFinalizeDialog(false)
    }
  }

  // 'notes' keeps its dedicated endpoint (direct JSON import without an AI
  // round-trip) and 'tasks' its importer; everything else — audio and/or
  // transcript text — goes through the SAME unified /process-sources endpoint
  // the create page uses. One pipeline, one set of error messages.
  const usesUnifiedPipeline =
    protocol.input_method !== 'notes' && protocol.input_method !== 'tasks'

  const getReprocessMinLength = () => {
    switch (protocol.input_method) {
      case 'tasks': return 10
      case 'notes': return 20
      default: return 50
    }
  }

  const canProcess = usesUnifiedPipeline
    ? audioFile !== null || transcript.trim().length >= getReprocessMinLength()
    : transcript.trim().length >= getReprocessMinLength()

  const handleProcess = async () => {
    if (!canProcess) return
    setProcessing(true)
    setError(null)

    try {
      if (usesUnifiedPipeline) {
        if (audioFile) {
          const validationError = validateAudioUpload(audioFile)
          if (validationError) throw new Error(validationError)
        }
        const formData = new FormData()
        if (audioFile) formData.append('audio', audioFile)
        if (transcript.trim()) formData.append('text', transcript)
        const result = await apiFetch<void>(`/api/protocols/${protocol.id}/process-sources`, {
          method: 'POST',
          body: formData,
          formData: true,
        })
        if (!result.success) throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
      } else {
        const endpoint = protocol.input_method === 'tasks' ? 'import-tasks' : 'process-notes'
        const result = await apiFetch<void>(`/api/protocols/${protocol.id}/${endpoint}`, {
          method: 'POST',
          body: { content: transcript },
        })
        if (!result.success) throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
      }

      setAudioFile(null)
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateTask = async (actionItem: StructuredNotes['action_items'][0]) => {
    setCreatingTask(actionItem.id)
    setError(null)

    try {
      const topicTitle = notes?.topics.find(t => t.id === actionItem.topic_id)?.title || ''
      const result = await apiFetch<void>(`/api/protocols/${protocol.id}/actions`, {
        method: 'POST',
        body: {
          action_item_id: actionItem.id,
          link_type: 'task',
          task_data: {
            title: actionItem.description,
            description: `Aus Protokoll: ${protocol.title} (${formatDateShort(protocol.meeting_date)})${topicTitle ? `\nThema: ${topicTitle}` : ''}`,
            task_type: 'one_time',
            category: 'admin',
            priority: actionItem.priority_hint || TASK_PRIORITIES.NORMAL,
            assigned_to: actionItem.assigned_to_id,
          },
        },
      })
      if (!result.success) throw new Error(result.error || 'Fehler beim Erstellen der Aufgabe')
      router.refresh()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setCreatingTask(null)
    }
  }

  /**
   * Add a task the AI did NOT recognize from the transcript.
   *
   * Two steps so the protocol stays the SSOT: the new item is first
   * appended to structured_notes.action_items (provenance: it belongs to
   * this meeting), then created + linked as a real task via the same
   * /actions endpoint the recognized items use.
   */
  const [addingCustomTask, setAddingCustomTask] = useState(false)
  const handleAddCustomTask = async (
    description: string,
    assignee: { id: string; name: string } | null,
  ): Promise<boolean> => {
    const trimmed = description.trim()
    if (!trimmed || !notes) return false
    setAddingCustomTask(true)
    setError(null)

    try {
      const newItem: StructuredNotes['action_items'][0] = {
        id: `custom-${crypto.randomUUID()}`,
        description: trimmed,
        assigned_to_name: assignee?.name ?? null,
        assigned_to_id: assignee?.id ?? null,
        due_hint: null,
        item_type: 'task',
        topic_id: null,
        priority_hint: null,
      }

      const patchResult = await apiFetch<void>(`/api/protocols/${protocol.id}`, {
        method: 'PATCH',
        body: {
          structured_notes: { ...notes, action_items: [...notes.action_items, newItem] },
        },
      })
      if (!patchResult.success) throw new Error(patchResult.error || 'Fehler beim Speichern')

      const linkResult = await apiFetch<void>(`/api/protocols/${protocol.id}/actions`, {
        method: 'POST',
        body: {
          action_item_id: newItem.id,
          link_type: 'task',
          task_data: {
            title: trimmed,
            description: `Aus Protokoll: ${protocol.title} (${formatDateShort(protocol.meeting_date)}) — manuell ergänzt`,
            task_type: 'one_time',
            category: 'admin',
            priority: TASK_PRIORITIES.NORMAL,
            assigned_to: assignee?.id ?? null,
          },
        },
      })
      if (!linkResult.success) throw new Error(linkResult.error || 'Fehler beim Erstellen der Aufgabe')

      router.refresh()
      return true
    } catch (err) {
      setError(getErrorMessage(err))
      return false
    } finally {
      setAddingCustomTask(false)
    }
  }

  const handleCreateAllTasks = async () => {
    if (!notes || unlinkedTaskItems.length === 0) return
    setBulkCreatingTasks(true)
    setError(null)
    setBulkTaskErrors([])

    const failures: string[] = []
    for (const item of unlinkedTaskItems) {
      try {
        const topicTitle = notes.topics.find(t => t.id === item.topic_id)?.title || ''
        const result = await apiFetch<void>(`/api/protocols/${protocol.id}/actions`, {
          method: 'POST',
          body: {
            action_item_id: item.id,
            link_type: 'task',
            task_data: {
              title: item.description,
              description: `Aus Protokoll: ${protocol.title} (${formatDateShort(protocol.meeting_date)})${topicTitle ? `\nThema: ${topicTitle}` : ''}`,
              task_type: 'one_time',
              category: 'admin',
              priority: item.priority_hint || TASK_PRIORITIES.NORMAL,
              assigned_to: item.assigned_to_id,
            },
          },
        })
        if (!result.success) failures.push(item.description)
      } catch {
        failures.push(item.description)
      }
    }

    if (failures.length > 0) {
      setBulkTaskErrors(failures)
      setError(`${failures.length} Aufgaben konnten nicht erstellt werden. Bitte erneut versuchen.`)
    }
    setBulkCreatingTasks(false)
    router.refresh()
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)

    try {
      const result = await apiFetch<void>(`/api/protocols/${protocol.id}`, { method: 'DELETE' })
      if (!result.success) throw new Error(result.error || 'Fehler beim Löschen')
      router.push('/admin/protocols')
    } catch (err) {
      setError(getErrorMessage(err))
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  // handleImportExternal removed per admin UX audit Z.2 — was the only
  // caller of ExternalAIPanel, which posted user-pasted external-AI
  // structured JSON to /api/protocols/[id]/process-notes. The in-app AI
  // structuring (handleProcessNotes above) uses the same endpoint without
  // the out-of-app round-trip.

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') setTranscript(text)
    }
    reader.readAsText(file)
  }

  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  return {
    notes,
    isReview,
    isDraft,
    isFinalized,
    error,
    initialProcessingError,
    usesUnifiedPipeline,
    canProcess,
    // Topics
    expandedTopics,
    toggleTopic,
    // Mapping
    attendeeMapping,
    setAttendeeMapping,
    mappingDirty,
    setMappingDirty,
    savingMapping,
    handleSaveMapping,
    // Processing
    transcript,
    setTranscript,
    audioFile,
    processing,
    handleProcess,
    handleFileUpload,
    handleAudioFileSelect,
    getReprocessMinLength,
    // Actions
    linkedActionIds,
    unlinkedTaskItems,
    creatingTask,
    handleCreateTask,
    bulkCreatingTasks,
    bulkTaskErrors,
    handleCreateAllTasks,
    addingCustomTask,
    handleAddCustomTask,
    // Finalize
    finalizing,
    showFinalizeDialog,
    setShowFinalizeDialog,
    handleFinalize,
    // Delete
    deleting,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
  }
}
