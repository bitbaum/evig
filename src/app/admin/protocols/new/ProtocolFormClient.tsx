'use client'

/**
 * Protocol Form Client Component
 *
 * Single-page progressive form with stepper:
 * 1. Select meeting type (grid of cards with icons)
 * 2. Fill details (title, date, visibility)
 * 3. Select input method (audio, transcript, notes, tasks)
 * 4. Enter content (adapts to selected method)
 */

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Stepper } from '@/components/ui/Stepper'
import {
  MEETING_TYPE_LABELS,
  MEETING_TYPE_TEMPLATES,
} from '@/config/protocols'
import type { MeetingType, ProtocolVisibility, InputMethod } from '@/config/protocols'
import { getErrorMessage } from '@/lib/utils/error'
import { validateAudioUpload } from '@/lib/protocols/audio-validation'
import {
  MeetingTypeStep,
  ProtocolDetailsStep,
  InputMethodStep,
  ContentInputStep,
} from '@/components/admin/protocols'

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

  const hasType = formData.meeting_type !== ''
  const hasDetails = hasType && formData.title.trim() !== '' && formData.meeting_date !== ''
  const hasInputMethod = hasDetails && formData.input_method !== ''
  const currentStep = !hasType ? 0 : !hasDetails ? 1 : !hasInputMethod ? 2 : 3

  const contentFormat = useMemo(() => {
    if (!formData.content.trim()) return null
    try {
      JSON.parse(formData.content)
      return 'json' as const
    } catch {
      return 'text' as const
    }
  }, [formData.content])

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validationError = validateAudioUpload(file)
    if (validationError) { setError(validationError); return }
    setError(null)
    setAudioFile(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') setFormData(prev => ({ ...prev, content: text }))
    }
    reader.readAsText(file)
  }

  const getProcessEndpoint = () => {
    switch (formData.input_method) {
      case 'notes': return 'process-notes'
      case 'tasks': return 'import-tasks'
      default: return 'process'
    }
  }

  const getProcessBody = () => {
    if (formData.input_method === 'transcript') return { raw_transcript: formData.content }
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
      if (!createData.success) throw new Error(createData.error || 'Fehler beim Erstellen')

      const protocolId = createData.data.id
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
          if (processAudioData.error) params.set('error', String(processAudioData.error).slice(0, 250))
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
          const params = new URLSearchParams()
          params.set('processing', 'failed')
          params.set('retryable', String(processData.retryable ?? true))
          if (processData.error) params.set('error', String(processData.error).slice(0, 250))
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
      )}

      <MeetingTypeStep
        selectedType={formData.meeting_type}
        onSelect={(type) => setFormData(prev => ({ ...prev, meeting_type: type }))}
        onReset={() => setFormData(prev => ({ ...prev, meeting_type: '', title: '', input_method: '', content: '' }))}
      />

      {hasType && (
        <ProtocolDetailsStep
          values={{ title: formData.title, meeting_date: formData.meeting_date, visibility: formData.visibility }}
          isComplete={hasDetails}
          onChange={handleChange}
          onReset={() => setFormData(prev => ({ ...prev, title: '' }))}
        />
      )}

      {hasDetails && (
        <InputMethodStep
          selectedMethod={formData.input_method}
          onSelect={(method) => {
            setFormData(prev => ({ ...prev, input_method: method, content: '' }))
            setAudioFile(null)
            setAudioStage('idle')
          }}
          onReset={() => setFormData(prev => ({ ...prev, input_method: '', content: '' }))}
        />
      )}

      {hasInputMethod && formData.input_method && formData.meeting_type && (
        <ContentInputStep
          inputMethod={formData.input_method as InputMethod}
          meetingType={formData.meeting_type as MeetingType}
          content={formData.content}
          loading={loading}
          processing={processing}
          audioFile={audioFile}
          audioStage={audioStage}
          contentFormat={contentFormat}
          submitButtonLabel={getSubmitButtonLabel()}
          onContentChange={handleChange}
          onAudioUpload={handleAudioUpload}
          onFileUpload={handleFileUpload}
          onCreateAndProcess={() => {
            if (formData.input_method === 'audio') setAudioStage('processing')
            handleCreateAndProcess()
          }}
          onCreateWithoutContent={() => {
            setFormData(prev => ({ ...prev, content: '' }))
            handleCreateAndProcess()
          }}
          onBack={() => {
            setFormData(prev => ({ ...prev, input_method: '', content: '' }))
            setAudioFile(null)
          }}
        />
      )}
    </div>
  )
}
