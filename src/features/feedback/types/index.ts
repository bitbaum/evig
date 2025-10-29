/**
 * Feedback system types
 * @fileoverview Type definitions for the feedback suggestion system
 */

export type FeedbackScope = 'page' | 'site' | 'element'

export interface SelectedElement {
  element: Element
  selector: string
  text?: string
}

export interface SuggestionFormData {
  suggestion: string
  contact?: string
}

export interface PageInfo {
  path: string
  title?: string
  url: string
}

export interface SuggestionContextValue {
  currentPage: PageInfo
  isVisible: boolean
}






