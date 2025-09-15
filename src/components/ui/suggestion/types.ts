/**
 * Type definitions for the Suggestion system
 * @fileoverview Centralized type definitions for better maintainability and type safety
 */

export interface SelectedElement {
  element: Element
  elementType: string
  elementText: string
  selector: string
}

export interface SuggestionFormData {
  suggestion: string
  contact?: string
  selectedElements?: SelectedElement[]
}

export type FeedbackScope = 'page' | 'element' | 'site'

export interface SuggestionContextualData {
  page: string
  url: string
  pageTitle?: string
  pageSection?: string
  feedbackScope: FeedbackScope
  selectedElements?: Array<{
    elementType: string
    elementText: string
    selector: string
  }>
  timestamp: string
}

export interface SuggestionSubmission {
  suggestion: string
  contact?: string
  page: string
  url: string
  pageTitle?: string
  pageSection?: string
  feedbackScope: FeedbackScope
  selectedElements?: Array<{
    elementType: string
    elementText: string
    selector: string
  }>
  timestamp: string
}

/**
 * Contextual suggestions based on feedback scope
 */
export const CONTEXTUAL_SUGGESTIONS = {
  site: ["Navigation verbessern", "Design modernisieren", "Performance optimieren", "Mobile verbessern"],
  page: ["Details hinzufügen", "Link reparieren", "Layout verbessern", "Inhalt aktualisieren"],
  element: (count: number) => count > 0 ? [
    "Besser sichtbar machen",
    "Neu positionieren",
    "Text ändern",
    "Entfernen"
  ] : ["Element auswählen"]
} as const

/**
 * Scope configuration for UI styling and behavior
 */
export const SCOPE_CONFIG = {
  site: {
    emoji: '🌐',
    name: 'Gesamte Website',
    color: '#7c3aed',
    focusRing: 'focus:ring-purple-500',
    buttonBg: 'bg-purple-600 hover:bg-purple-700',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-900',
    hoverBg: 'hover:bg-purple-50 hover:border-purple-300'
  },
  page: {
    emoji: '📄',
    name: 'Diese Seite',
    color: '#16a34a',
    focusRing: 'focus:ring-green-500',
    buttonBg: 'bg-green-600 hover:bg-green-700',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-900',
    hoverBg: 'hover:bg-green-50 hover:border-green-300'
  },
  element: {
    emoji: '🎯',
    name: 'Spezifisches Element',
    color: '#2563eb',
    focusRing: 'focus:ring-blue-500',
    buttonBg: 'bg-blue-600 hover:bg-blue-700',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-900',
    hoverBg: 'hover:bg-blue-50 hover:border-blue-300'
  }
} as const

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  WINDOW: 5 * 60 * 1000, // 5 minutes
  MAX_REQUESTS: 3 // Max 3 suggestions per window per IP
} as const

/**
 * Validation constraints
 */
export const VALIDATION = {
  MIN_LENGTH: 5,
  MAX_LENGTH_UI: 500,
  MAX_LENGTH_API: 1000,
  SPAM_INDICATORS: ['http://', 'https://', 'www.', 'viagra', 'casino', 'crypto']
} as const