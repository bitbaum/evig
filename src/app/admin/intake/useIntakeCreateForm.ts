'use client'

import { useState, useCallback, useRef } from 'react'
import type { CreateFormData } from './types'
import { INITIAL_FORM_DATA } from './types'

export function useIntakeCreateForm() {
  const [formData, setFormData] = useState<CreateFormData>({ ...INITIAL_FORM_DATA })
  const [saving, setSaving] = useState(false)

  // AI input
  const [aiTab, setAiTab] = useState<'text' | 'voice' | 'photo'>('text')
  const [aiText, setAiText] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)

  // Voice recording
  const [voiceState, setVoiceState] = useState<'idle' | 'recording' | 'processing'>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const applyAiData = useCallback((data: Record<string, unknown>) => {
    setFormData(f => ({
      ...f,
      hersteller: (data.hersteller as string) || f.hersteller,
      produktname: (data.produktname as string) || f.produktname,
      kurzbeschreibung: (data.kurzbeschreibung as string) || f.kurzbeschreibung,
      zustand: (data.zustand as string) || f.zustand,
      hauptkategorie: (data.hauptkategorie as string) || f.hauptkategorie,
      unterkategorie: (data.unterkategorie as string) || f.unterkategorie,
      verkaufspreis: data.verkaufspreis ? Number(data.verkaufspreis) : f.verkaufspreis,
    }))
  }, [])

  const handleAiTextExtract = useCallback(async () => {
    if (aiText.trim().length < 3) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/admin/intake/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      })
      const json = await res.json()
      if (json.success) {
        applyAiData(json.data.data)
      } else {
        setAiError(json.error || 'Extraktion fehlgeschlagen')
      }
    } catch {
      setAiError('Netzwerkfehler')
    } finally {
      setAiLoading(false)
    }
  }, [aiText, applyAiData])

  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setVoiceState('processing')

        try {
          const fd = new FormData()
          fd.append('audio', audioBlob, 'recording.webm')
          const res = await fetch('/api/admin/intake/extract-voice', { method: 'POST', body: fd })
          const json = await res.json()
          if (json.success) {
            applyAiData(json.data.data)
            setAiText(json.data.transcription || '')
          } else {
            setAiError(json.error || 'Spracherkennung fehlgeschlagen')
          }
        } catch {
          setAiError('Netzwerkfehler')
        } finally {
          setVoiceState('idle')
        }
      }

      mediaRecorder.start()
      setVoiceState('recording')
      setAiError(null)
    } catch {
      setAiError('Mikrofon nicht verfügbar')
    }
  }, [applyAiData])

  const stopVoiceRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const handlePhotoAnalysis = useCallback((data: Record<string, unknown>) => {
    applyAiData(data)
  }, [applyAiData])

  const handleCreate = useCallback(async (onSuccess?: () => void) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          verkaufspreis: formData.verkaufspreis || undefined,
          donor_email: formData.donor_email || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setFormData({ ...INITIAL_FORM_DATA })
        onSuccess?.()
      }
    } finally {
      setSaving(false)
    }
  }, [formData])

  const prefillFromDonation = useCallback((donorName: string, donorEmail: string) => {
    setFormData(f => ({
      ...f,
      is_donation: true,
      donor_name: donorName,
      donor_email: donorEmail,
    }))
  }, [])

  return {
    formData, setFormData,
    saving,
    aiTab, setAiTab,
    aiText, setAiText,
    aiLoading,
    aiError,
    aiOpen, setAiOpen,
    voiceState,
    handleAiTextExtract,
    startVoiceRecording,
    stopVoiceRecording,
    handlePhotoAnalysis,
    handleCreate,
    prefillFromDonation,
  }
}
