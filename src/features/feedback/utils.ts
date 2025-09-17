/**
 * Utility functions for the Suggestion system
 * @fileoverview Helper functions for element selection, DOM manipulation, and validation
 */

import { SelectedElement, VALIDATION } from './types'

/**
 * Clear visual selection markers from all elements
 */
export const clearSelectedElements = (): void => {
  document.querySelectorAll('.suggestion-selected-element').forEach(el => {
    el.classList.remove('suggestion-selected-element')
  })
}

/**
 * Generate a CSS selector for an element
 * Prioritizes ID, then class names, then tag name
 */
export const generateElementSelector = (element: Element): string => {
  // Try ID first
  if (element.id) {
    return `#${element.id}`
  }

  // Try class names
  const classList = Array.from(element.classList)
  if (classList.length > 0) {
    return `.${classList[0]}` // Use first class for simplicity
  }

  // Fall back to tag name with nth-child if needed
  const tagName = element.tagName.toLowerCase()
  const parent = element.parentElement

  if (parent) {
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName)
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1
      return `${tagName}:nth-child(${index})`
    }
  }

  return tagName
}

/**
 * Create a SelectedElement object from a DOM element
 */
export const createSelectedElement = (element: Element): SelectedElement => {
  const elementType = element.tagName.toLowerCase()
  const elementText = element.textContent?.substring(0, 100) || ''
  const selector = generateElementSelector(element)

  return {
    element,
    elementType,
    elementText,
    selector
  }
}

/**
 * Check if an element is already selected
 */
export const isElementSelected = (element: Element, selectedElements: SelectedElement[]): boolean => {
  return selectedElements.some(selected => selected.element === element)
}

/**
 * Add visual highlight to an element during hover
 */
export const addElementHighlight = (element: HTMLElement): void => {
  element.style.outline = '2px solid #10b981'
  element.style.outlineOffset = '2px'
}

/**
 * Remove visual highlight from an element
 */
export const removeElementHighlight = (element: HTMLElement): void => {
  element.style.outline = ''
  element.style.outlineOffset = ''
}

/**
 * Clean up all element highlights
 */
export const cleanupAllHighlights = (): void => {
  document.querySelectorAll('[style*="outline"]').forEach(el => {
    const htmlEl = el as HTMLElement
    removeElementHighlight(htmlEl)
  })
}

/**
 * Validate suggestion text content
 */
export const validateSuggestion = (suggestion: string): string | null => {
  if (!suggestion || typeof suggestion !== 'string') {
    return 'Vorschlag ist erforderlich'
  }

  const trimmed = suggestion.trim()

  if (trimmed.length < VALIDATION.MIN_LENGTH) {
    return `Vorschlag muss mindestens ${VALIDATION.MIN_LENGTH} Zeichen lang sein`
  }

  if (trimmed.length > VALIDATION.MAX_LENGTH_UI) {
    return `Vorschlag ist zu lang (maximal ${VALIDATION.MAX_LENGTH_UI} Zeichen)`
  }

  // Check for spam indicators
  const hasSpam = VALIDATION.SPAM_INDICATORS.some(indicator =>
    trimmed.toLowerCase().includes(indicator.toLowerCase())
  )

  if (hasSpam) {
    return 'Vorschlag enthält nicht erlaubte Inhalte'
  }

  return null // Valid
}

/**
 * Validate email address format (basic)
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return true // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get character count color class based on current length
 */
export const getCharacterCountColor = (length: number): string => {
  if (length > VALIDATION.MAX_LENGTH_UI * 0.9) {
    return 'text-red-600'
  }
  if (length > VALIDATION.MAX_LENGTH_UI * 0.8) {
    return 'text-orange-600'
  }
  return 'text-gray-500'
}

/**
 * Debounce function to limit rapid function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Check if an element should be excluded from selection
 */
export const shouldExcludeElement = (element: Element): boolean => {
  // Exclude suggestion panel itself
  const suggestionPanel = document.querySelector('[data-suggestion-panel]')
  if (suggestionPanel?.contains(element)) {
    return true
  }

  // Exclude overlay elements
  if (element.hasAttribute('data-element-selection-overlay')) {
    return true
  }

  // Exclude script and style tags
  const excludedTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'TITLE', 'HEAD']
  if (excludedTags.includes(element.tagName)) {
    return true
  }

  return false
}

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('de-CH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Generate a unique session ID for tracking
 */
export const generateSessionId = (): string => {
  return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}