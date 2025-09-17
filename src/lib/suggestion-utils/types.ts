/**
 * Shared types for suggestion systems across the application
 * Used by both chatbot and feedback features
 */

export type Language = 'en' | 'de'

export interface NavigationSuggestion {
  /** Display label for the suggestion */
  label: string
  /** URL or path to navigate to */
  href: string
  /** Descriptive text explaining what this suggestion does */
  description: string
  /** Whether this link opens externally */
  external?: boolean
  /** Icon identifier (optional) */
  icon?: string
  /** Priority for ranking (higher = more important) */
  priority?: number
  /** Category for grouping suggestions */
  category?: 'service' | 'product' | 'info' | 'involvement' | 'contact' | 'learning' | 'project' | 'navigation'
}

export interface SuggestionConfig {
  key: string
  href: string
  options?: Partial<NavigationSuggestion>
}

export interface IconConfig {
  emoji: string
  fallback: string
}