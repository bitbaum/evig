/**
 * Types for Floating UI Components
 */

import type { FeedbackScope } from '@/config/feedback-scopes'
export type { FeedbackScope }

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
