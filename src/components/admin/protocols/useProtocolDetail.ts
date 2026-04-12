import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getErrorMessage } from '@/lib/utils/error'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import { PROTOCOL_WORKFLOW_STEPS, getProtocolWorkflowProgress, type ProtocolWorkflowStepId } from '@/lib/protocols/workflow'
import { apiFetch } from '@/lib/api/client'
import { formatDateShort } from '@/lib/date-formats'
import type { StructuredNotes } from '@/lib/schemas/protocols'
import type { ProtocolDetailProps } from './types'

const STEP_SECTION_IDS: Record<ProtocolWorkflowStepId, string> = {
  input: 'protocol-step-input',
  ai: 'protocol-step-ai',
  review: 'protocol-step-review',
  tasks: 'protocol-step-tasks',
  done: 'protocol-step-done',
}

export function useProtocolDetail({ protocol, actionLinks, initialProcessingError = null }: ProtocolDetailProps) {
  const router = useRouter()
  const [finalizing, setFinalizing] = useState(false)
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [savingMapping, setSavingMapping] = useState(false)
  const [creatingTask, setCreatingTask] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(initialProcessingError?.message || null)
  const [transcript, setTranscript] = useState('')
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [bulkCreatingTasks, setBulkCreatingTasks] = useState(false)
  const [bulkTaskErrors, setBulkTaskErrors] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const notes = protocol.structured_notes as StructuredNotes | null
  const isReview = protocol.status === 'review'
  const isDraft = protocol.status === 'draft'
  const isFinalized = protocol.status === 'finalized'

  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    () => new Set(isReview && notes?.topics ? notes.topics.map(t => t.id) : [])
  )

  useEffect(() => {
    if (isReview && notes?.topics && expandedTopics.size === 0) {
      setExpandedTopics(new Set(notes.topics.map(t => t.id)))
    }
  }, [isReview, notes?.topics]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!transcript && protocol.raw_transcript) {
      setTranscript(protocol.raw_transcript)
    }
  }, [protocol.raw_transcript, transcript])

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

  const workflowProgress = getProtocolWorkflowProgress({
    status: protocol.status,
    hasStructuredNotes: Boolean(notes),
    unlinkedTaskCount: unlinkedTaskItems.length,
  })
  const currentStepIndex = PROTOCOL_WORKFLOW_STEPS.findIndex((step) => step.id === workflowProgress.currentStepId)

  const scrollToStep = (stepId: ProtocolWorkflowStepId) => {
    const section = document.getElementById(STEP_SECTION_IDS[stepId])
    if (!section) return
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

      const result = await apiFetch<void>(`/api/protocols/${protocol.id}`, {
        method: 'PATCH',
        body: { structured_notes: updatedNotes },
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

  const getReprocessEndpoint = () => {
    switch (protocol.input_method) {
      case 'notes': return 'process-notes'
      case 'tasks': return 'import-tasks'
      case 'audio': return 'process-audio'
      default: return 'process'
    }
  }

  const getReprocessMinLength = () => {
    switch (protocol.input_method) {
      case 'tasks': return 10
      case 'notes': return 20
      default: return 50
    }
  }

  const getReprocessBody = () => {
    if (protocol.input_method === 'transcript' || protocol.input_method === 'audio') {
      return { raw_transcript: transcript }
    }
    return { content: transcript }
  }

  const handleProcess = async () => {
    if (protocol.input_method !== 'audio' && transcript.length < getReprocessMinLength()) return
    setProcessing(true)
    setError(null)

    try {
      const endpoint = getReprocessEndpoint()

      if (protocol.input_method === 'audio') {
        if (!audioFile) throw new Error('Bitte wähle eine Audiodatei aus.')
        const validationError = validateAudioUpload(audioFile)
        if (validationError) throw new Error(validationError)

        const formData = new FormData()
        formData.append('audio', audioFile)
        const result = await apiFetch<void>(`/api/protocols/${protocol.id}/${endpoint}`, {
          method: 'POST',
          body: formData,
          formData: true,
        })
        if (!result.success) throw new Error(result.error || 'Verarbeitung fehlgeschlagen')
      } else {
        const result = await apiFetch<void>(`/api/protocols/${protocol.id}/${endpoint}`, {
          method: 'POST',
          body: getReprocessBody(),
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
            priority: actionItem.priority_hint || 'normal',
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
              priority: item.priority_hint || 'normal',
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
    // Workflow
    workflowProgress,
    currentStepIndex,
    scrollToStep,
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
