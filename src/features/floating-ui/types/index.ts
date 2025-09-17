/**
 * Types for Floating UI Components
 */

export type FeedbackScope = 'page' | 'element' | 'site'

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