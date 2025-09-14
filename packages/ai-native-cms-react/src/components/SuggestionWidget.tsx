import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AINativeCMSConfig, SuggestionInput } from '@ai-native-cms/core/types'

export interface SuggestionWidgetProps {
  config: AINativeCMSConfig
  className?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'inline'
  theme?: 'light' | 'dark' | 'auto'
  buttonText?: string
  placeholder?: string
  onSubmit?: (suggestion: SuggestionInput) => void
  onSuccess?: () => void
  onError?: (error: Error) => void
  disabled?: boolean
  style?: React.CSSProperties
  buttonStyle?: React.CSSProperties
  modalStyle?: React.CSSProperties
}

interface FormData {
  suggestion: string
  contact: string
}

export const SuggestionWidget: React.FC<SuggestionWidgetProps> = ({
  config,
  className = '',
  position = 'bottom-right',
  theme = 'auto',
  buttonText = 'Suggest an edit',
  placeholder = 'What would you like to change on this page?',
  onSubmit,
  onSuccess,
  onError,
  disabled = false,
  style,
  buttonStyle,
  modalStyle
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    suggestion: '',
    contact: ''
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.suggestion.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const suggestionData: SuggestionInput = {
        content: formData.suggestion.trim(),
        contact: formData.contact.trim() || undefined,
        page: window.location.pathname,
        url: window.location.href,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          referrer: document.referrer
        }
      }

      // Call custom onSubmit if provided
      if (onSubmit) {
        await onSubmit(suggestionData)
      } else {
        // Default submission to API endpoint
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(suggestionData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}`)
        }
      }

      setSubmitted(true)
      setFormData({ suggestion: '', contact: '' })
      
      if (onSuccess) {
        onSuccess()
      }

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
      }, 2000)

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Submission failed')
      setError(error.message)
      
      if (onError) {
        onError(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isSubmitting, onSubmit, onSuccess, onError])

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }, [])

  const openModal = useCallback(() => {
    if (disabled) return
    setIsOpen(true)
    setError(null)
  }, [disabled])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setError(null)
  }, [])

  // Get theme-based classes
  const getThemeClass = () => {
    if (theme === 'auto') {
      return 'ai-cms-theme-auto'
    }
    return `ai-cms-theme-${theme}`
  }

  // Get position classes for floating button
  const getPositionClass = () => {
    if (position === 'inline') return ''
    
    const positions = {
      'bottom-right': 'fixed bottom-6 right-6',
      'bottom-left': 'fixed bottom-6 left-6',
      'top-right': 'fixed top-6 right-6',
      'top-left': 'fixed top-6 left-6'
    }
    return positions[position]
  }

  // Render floating button
  const renderButton = () => (
    <button
      onClick={openModal}
      disabled={disabled}
      className={`
        ai-cms-suggestion-button
        ${getPositionClass()}
        ${disabled ? 'ai-cms-disabled' : ''}
        ${className}
      `}
      style={{ ...buttonStyle, ...style }}
      aria-label={buttonText}
      title={buttonText}
    >
      <svg 
        className="ai-cms-button-icon" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        width="24"
        height="24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
        />
      </svg>
      {position === 'inline' && <span className="ai-cms-button-text">{buttonText}</span>}
    </button>
  )

  // Render modal content
  const renderModal = () => {
    if (!isOpen) return null

    return (
      <div className={`ai-cms-modal-overlay ${getThemeClass()}`}>
        <div 
          ref={modalRef}
          className="ai-cms-modal-content"
          style={modalStyle}
        >
          {submitted ? (
            <div className="ai-cms-success-message">
              <div className="ai-cms-success-icon">
                <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="ai-cms-success-title">Thank you!</h3>
              <p className="ai-cms-success-text">
                Your suggestion has been sent to our team.
              </p>
            </div>
          ) : (
            <>
              <div className="ai-cms-modal-header">
                <h3 className="ai-cms-modal-title">Suggest an Edit</h3>
                <button
                  onClick={closeModal}
                  className="ai-cms-close-button"
                  aria-label="Close"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="ai-cms-form">
                <div className="ai-cms-form-group">
                  <label htmlFor="ai-cms-suggestion" className="ai-cms-label">
                    What would you like to change on this page? *
                  </label>
                  <textarea
                    ref={textareaRef}
                    id="ai-cms-suggestion"
                    value={formData.suggestion}
                    onChange={(e) => handleInputChange('suggestion', e.target.value)}
                    className="ai-cms-textarea"
                    rows={4}
                    placeholder={placeholder}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="ai-cms-form-group">
                  <label htmlFor="ai-cms-contact" className="ai-cms-label">
                    Your contact (optional)
                  </label>
                  <input
                    type="text"
                    id="ai-cms-contact"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    className="ai-cms-input"
                    placeholder="Your name or email (optional)"
                    disabled={isSubmitting}
                  />
                </div>

                {error && (
                  <div className="ai-cms-error-message">
                    {error}
                  </div>
                )}

                <div className="ai-cms-form-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="ai-cms-button ai-cms-button-secondary"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.suggestion.trim()}
                    className="ai-cms-button ai-cms-button-primary"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Suggestion'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {renderButton()}
      {renderModal()}
    </>
  )
}

export default SuggestionWidget