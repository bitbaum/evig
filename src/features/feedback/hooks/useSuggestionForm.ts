/**
 * useSuggestionForm Hook
 * @fileoverview Custom hook for managing suggestion form state and submission
 */

import { useState, useCallback } from 'react'
import { SuggestionFormData, FeedbackScope, SelectedElement } from '../types'
import { submitSuggestionToAPI } from '@/lib/api/submit-suggestion'

interface UseSuggestionFormProps {
  onSuccess?: () => void
}

interface UseSuggestionFormReturn {
  formData: SuggestionFormData
  isSubmitting: boolean
  submitError: string | null
  updateSuggestion: (suggestion: string) => void
  updateContact: (contact: string) => void
  resetForm: () => void
  submitSuggestion: (scope: FeedbackScope, selectedElements: SelectedElement[]) => Promise<boolean>
  setSubmitError: (error: string | null) => void
}

export function useSuggestionForm({ onSuccess }: UseSuggestionFormProps = {}): UseSuggestionFormReturn {
  const [formData, setFormData] = useState<SuggestionFormData>({
    suggestion: '',
    contact: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateSuggestion = useCallback((suggestion: string) => {
    setFormData(prev => ({ ...prev, suggestion }))
    if (submitError) setSubmitError(null)
  }, [submitError])

  const updateContact = useCallback((contact: string) => {
    setFormData(prev => ({ ...prev, contact }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({ suggestion: '', contact: '' })
    setSubmitError(null)
  }, [])

  const submitSuggestion = useCallback(async (
    scope: FeedbackScope,
    selectedElements: SelectedElement[]
  ): Promise<boolean> => {
    if (!formData.suggestion.trim()) {
      setSubmitError('Bitte geben Sie einen Verbesserungsvorschlag ein.')
      return false
    }

    if (scope === 'element' && selectedElements.length === 0) {
      setSubmitError('Bitte wählen Sie mindestens ein Element aus.')
      return false
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const ok = await submitSuggestionToAPI(
        {
          suggestion: formData.suggestion,
          contact: formData.contact,
          scope,
          selectedElements: selectedElements.map(el => ({ selector: el.selector, text: el.text })),
          pageUrl: window.location.href,
          timestamp: new Date().toISOString(),
        },
        setSubmitError
      )
      if (ok) onSuccess?.()
      return ok
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onSuccess])

  return {
    formData,
    isSubmitting,
    submitError,
    updateSuggestion,
    updateContact,
    resetForm,
    submitSuggestion,
    setSubmitError
  }
}






