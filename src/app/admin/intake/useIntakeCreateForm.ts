'use client'

import { useState, useCallback, useRef } from 'react'
import { apiFetch } from '@/lib/api/client'
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
  const [aiOpen, setAiOpen] = useState(true)

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
      const result = await apiFetch<{ data: Record<string, unknown> }>(
        '/api/admin/intake/extract-text',
        { method: 'POST', body: { text: aiText } },
      )
      if (result.success && result.data) {
        applyAiData(result.data.data)
      } else {
        setAiError(result.error || 'Extraktion fehlgeschlagen')
      }
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
          const result = await apiFetch<{ data: Record<string, unknown>; transcription?: string }>(
            '/api/admin/intake/extract-voice',
            { method: 'POST', body: fd, formData: true },
          )
          if (result.success && result.data) {
            applyAiData(result.data.data)
            setAiText(result.data.transcription || '')
          } else {
            setAiError(result.error || 'Spracherkennung fehlgeschlagen')
          }
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

  const handleCreate = useCallback(async (onSuccess?: (inventoryId: string) => void) => {
    setSaving(true)
    try {
      const result = await apiFetch<{ inventory_id: string }>('/api/admin/intake', {
        method: 'POST',
        body: {
          ...formData,
          verkaufspreis: formData.verkaufspreis || undefined,
          donor_email: formData.donor_email || undefined,
          // Zod schema accepts uuid().optional() — convert null sentinel to undefined
          existing_donation_id: formData.existing_donation_id || undefined,
        },
      })
      if (result.success && result.data) {
        setFormData({ ...INITIAL_FORM_DATA })
        onSuccess?.(result.data.inventory_id)
      }
    } finally {
      setSaving(false)
    }
  }, [formData])

  const prefillFromDonation = useCallback((donorName: string, donorEmail: string, donationId?: string) => {
    setFormData(f => ({
      ...f,
      is_donation: true,
      donor_name: donorName,
      donor_email: donorEmail,
      existing_donation_id: donationId ?? null,
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
