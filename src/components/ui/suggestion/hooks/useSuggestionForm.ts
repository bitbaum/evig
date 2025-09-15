/**
 * Suggestion Form Hook
 * @fileoverview Custom hook for form state management and submission logic
 */

import { useState, useCallback } from 'react'
import { FeedbackScope, SelectedElement, SuggestionFormData, SuggestionSubmission } from '../types'
import { validateSuggestion } from '../utils'
import { useSuggestionContext } from '@/contexts/SuggestionContext'

interface UseSuggestionFormOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useSuggestionForm(options: UseSuggestionFormOptions = {}) {
  const { currentPage } = useSuggestionContext()
  const [formData, setFormData] = useState<SuggestionFormData>({
    suggestion: '',
    contact: '',
    selectedElements: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateSuggestion = useCallback((suggestion: string) => {
    setFormData(prev => ({ ...prev, suggestion }))
    // Clear any existing errors when user starts typing (check inside callback to avoid dependencies)
    setSubmitError(prevError => prevError ? null : null)
  }, [])

  const updateContact = useCallback((contact: string) => {
    setFormData(prev => ({ ...prev, contact }))
  }, [])

  const updateSelectedElements = useCallback((selectedElements: SelectedElement[]) => {
    setFormData(prev => ({ ...prev, selectedElements }))
  }, [])

  const resetForm = useCallback(() => {
    setFormData({
      suggestion: '',
      contact: '',
      selectedElements: []
    })
    setSubmitError(null)
  }, [])

  const submitSuggestion = useCallback(async (
    feedbackScope: FeedbackScope,
    selectedElements: SelectedElement[]
  ) => {
    // Validate before submission
    const validationError = validateSuggestion(formData.suggestion)
    if (validationError) {
      setSubmitError(validationError)
      return false
    }

    if (feedbackScope === 'element' && selectedElements.length === 0) {
      setSubmitError('Bitte wählen Sie mindestens ein Element aus')
      return false
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const submission: SuggestionSubmission = {
        suggestion: formData.suggestion.trim(),
        contact: formData.contact?.trim(),
        page: currentPage.path,
        url: typeof window !== 'undefined' ? window.location.href : '',
        pageTitle: currentPage.title,
        pageSection: currentPage.section,
        feedbackScope,
        selectedElements: selectedElements.map(el => ({
          elementType: el.elementType,
          elementText: el.elementText,
          selector: el.selector
        })),
        timestamp: new Date().toISOString(),
      }

      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      })

      if (response.ok) {
        resetForm()
        options.onSuccess?.()
        return true
      } else {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || errorData.message || `Fehler beim Senden (${response.status})`
        setSubmitError(errorMessage)
        options.onError?.(errorMessage)
        return false
      }
    } catch (error) {
      console.error('Failed to submit suggestion:', error)
      const errorMessage = 'Netzwerkfehler. Bitte versuchen Sie es später erneut.'
      setSubmitError(errorMessage)
      options.onError?.(errorMessage)
      return false
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, currentPage, resetForm, options])

  return {
    formData,
    isSubmitting,
    submitError,
    updateSuggestion,
    updateContact,
    updateSelectedElements,
    resetForm,
    submitSuggestion,
    setSubmitError
  }
}
