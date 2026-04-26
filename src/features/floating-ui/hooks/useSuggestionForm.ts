'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { FeedbackScope, SelectedElement } from '../types'

interface UseSuggestionFormParams {
  feedbackScope: FeedbackScope
  selectedElements: SelectedElement[]
  onSubmitSuccess: () => void
}

/**
 * Get current page path and title from the browser.
 */
export function getCurrentPageInfo() {
  if (typeof window === 'undefined') return { path: '/', title: 'Home' }
  return {
    path: window.location.pathname,
    title: document.title || window.location.pathname
  }
}

export function useSuggestionForm({ feedbackScope, selectedElements, onSubmitSuccess }: UseSuggestionFormParams) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const contactRef = useRef<HTMLInputElement>(null)

  // Ref to always have latest callback without re-creating handleSubmit
  const onSubmitSuccessRef = useRef(onSubmitSuccess)
  useEffect(() => {
    onSubmitSuccessRef.current = onSubmitSuccess
  }, [onSubmitSuccess])

  const handleQuickSuggestion = useCallback((suggestion: string) => {
    const currentValue = textareaRef.current?.value || ''
    const newSuggestion = currentValue
      ? `${currentValue} ${suggestion}`
      : suggestion

    if (textareaRef.current) {
      textareaRef.current.value = newSuggestion
      setSubmitError(null)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const actualSuggestion = textareaRef.current?.value?.trim() || ''
    const actualContact = contactRef.current?.value?.trim() || ''

    if (!actualSuggestion) {
      setSubmitError('Bitte geben Sie einen Vorschlag ein.')
      return
    }

    if (feedbackScope === 'element' && selectedElements.length === 0) {
      setSubmitError('Bitte wählen Sie mindestens ein Element aus.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const currentPage = getCurrentPageInfo()

      const submissionData = {
        suggestion: actualSuggestion,
        contact: actualContact || undefined,
        page: currentPage.path,
        url: window.location.href,
        pageTitle: currentPage.title,
        pageSection: currentPage.path.split('/')[1] || 'home',
        feedbackScope,
        selectedElements: selectedElements.map(el => ({
          elementType: el.elementType,
          elementText: el.elementText.substring(0, 100),
          selector: el.selector
        })),
        timestamp: new Date().toISOString()
      }

      const result = await apiFetch<unknown>('/api/suggestions', {
        method: 'POST',
        body: submissionData,
      })

      if (!result.success) {
        logger.error('Submission error', { error: result.error })
        setSubmitError('Fehler beim Senden. Bitte versuche es erneut.')
      } else {
        setSubmitted(true)
        setTimeout(() => {
          onSubmitSuccessRef.current()
        }, 2000)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [feedbackScope, selectedElements])

  const resetFormState = useCallback(() => {
    setSubmitError(null)
    setSubmitted(false)
    if (textareaRef.current) {
      textareaRef.current.value = ''
    }
    if (contactRef.current) {
      contactRef.current.value = ''
    }
  }, [])

  return {
    isSubmitting,
    submitted,
    submitError,
    setSubmitError,
    textareaRef,
    contactRef,
    handleQuickSuggestion,
    handleSubmit,
    resetFormState,
  }
}
