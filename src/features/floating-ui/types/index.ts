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
